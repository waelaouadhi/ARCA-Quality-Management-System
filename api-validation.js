const http = require('http');
const https = require('https');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  startTime: Date.now(),
  authTokens: {},
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body,
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: null, rawBody: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

// GraphQL request helper
async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/graphql',
    method: 'POST',
    headers,
  };

  const data = { query, variables };
  return makeRequest(options, data);
}

// Test runner
async function runTest(name, testFn) {
  results.total++;
  const startTime = Date.now();

  try {
    await testFn();
    results.passed++;
    const duration = Date.now() - startTime;
    console.log(
      `${colors.green}✅ PASS${colors.reset} ${name} ${colors.cyan}(${duration}ms)${colors.reset}`
    );
    results.tests.push({ name, status: 'PASS', duration, error: null });
  } catch (error) {
    results.failed++;
    const duration = Date.now() - startTime;
    console.log(
      `${colors.red}❌ FAIL${colors.reset} ${name} ${colors.cyan}(${duration}ms)${colors.reset}`
    );
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    results.tests.push({ name, status: 'FAIL', duration, error: error.message });
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertExists(value, message) {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to exist');
  }
}

// ==============================================
// TEST SUITE
// ==============================================

console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║         QMS Backend API Validation Test Suite            ║
║                   Step 4: API Testing                     ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function runAllTests() {
  // 1. HEALTH CHECK VALIDATION
  console.log(`\n${colors.bright}${colors.yellow}[1] HEALTH CHECK VALIDATION${colors.reset}`);

  await runTest('Health endpoint returns 200', async () => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    };

    const response = await makeRequest(options);
    assertEquals(response.statusCode, 200, 'Health check should return 200');
    assertExists(response.body, 'Health check should return a body');
    assertEquals(response.body.status, 'ok', 'Health status should be ok');
    assertExists(response.body.timestamp, 'Health check should include timestamp');

    // Verify timestamp is recent (within last 5 seconds)
    const timestamp = new Date(response.body.timestamp).getTime();
    const now = Date.now();
    assert(now - timestamp < 5000, 'Timestamp should be recent');
  });

  // 2. GRAPHQL INTROSPECTION
  console.log(`\n${colors.bright}${colors.yellow}[2] GRAPHQL INTROSPECTION${colors.reset}`);

  await runTest('GraphQL introspection query works', async () => {
    const query = `
      query IntrospectionQuery {
        __schema {
          queryType { name }
          mutationType { name }
          types {
            name
            kind
          }
        }
      }
    `;

    const response = await graphqlRequest(query);
    assertEquals(response.statusCode, 200, 'Introspection should return 200');
    assertExists(response.body.data, 'Introspection should return data');
    assertExists(response.body.data.__schema, 'Schema should exist');
    assertEquals(
      response.body.data.__schema.queryType.name,
      'Query',
      'Query type should be named Query'
    );
    assertEquals(
      response.body.data.__schema.mutationType.name,
      'Mutation',
      'Mutation type should be named Mutation'
    );
  });

  await runTest('GraphQL lists all queries and mutations', async () => {
    const query = `
      query {
        __schema {
          queryType {
            fields {
              name
              description
            }
          }
          mutationType {
            fields {
              name
              description
            }
          }
        }
      }
    `;

    const response = await graphqlRequest(query);
    assertExists(response.body.data.__schema.queryType.fields, 'Query fields should exist');
    assertExists(response.body.data.__schema.mutationType.fields, 'Mutation fields should exist');

    const queries = response.body.data.__schema.queryType.fields.map((f) => f.name);
    const mutations = response.body.data.__schema.mutationType.fields.map((f) => f.name);

    console.log(`    Found ${queries.length} queries: ${queries.join(', ')}`);
    console.log(`    Found ${mutations.length} mutations: ${mutations.join(', ')}`);
  });

  // 3. AUTHENTICATION ENDPOINTS
  console.log(`\n${colors.bright}${colors.yellow}[3] AUTHENTICATION ENDPOINTS${colors.reset}`);

  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  await runTest('User registration with valid data', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            firstName
            lastName
            email
            role
          }
        }
      }
    `;

    const variables = {
      input: {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
      },
    };

    const response = await graphqlRequest(mutation, variables);
    assertEquals(response.statusCode, 200, 'Registration should return 200');
    assertExists(response.body.data, 'Registration should return data');
    assertExists(response.body.data.register, 'Register mutation should return result');
    assertExists(response.body.data.register.token, 'Registration should return token');
    assertExists(response.body.data.register.user, 'Registration should return user');
    assertEquals(response.body.data.register.user.email, testEmail, 'User email should match');

    results.authTokens.user = response.body.data.register.token;
    results.testUserId = response.body.data.register.user.id;
  });

  await runTest('User registration with duplicate email fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
            email
          }
        }
      }
    `;

    const variables = {
      input: {
        firstName: 'Another',
        lastName: 'User',
        email: testEmail,
        password: 'AnotherPassword123!',
      },
    };

    const response = await graphqlRequest(mutation, variables);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Duplicate email should return error'
    );
  });

  await runTest('User registration with weak password fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user {
            id
          }
        }
      }
    `;

    const variables = {
      input: {
        firstName: 'Weak',
        lastName: 'Password',
        email: `weak.${Date.now()}@example.com`,
        password: '123',
      },
    };

    const response = await graphqlRequest(mutation, variables);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Weak password should return error'
    );
  });

  await runTest('User login with valid credentials', async () => {
    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
          user {
            id
            email
            firstName
            lastName
            role
          }
        }
      }
    `;

    const variables = {
      email: testEmail,
      password: testPassword,
    };

    const response = await graphqlRequest(mutation, variables);
    assertEquals(response.statusCode, 200, 'Login should return 200');
    assertExists(response.body.data, 'Login should return data');
    assertExists(response.body.data.login, 'Login mutation should return result');
    assertExists(response.body.data.login.token, 'Login should return token');
    assertExists(response.body.data.login.user, 'Login should return user');
  });

  await runTest('User login with invalid credentials fails', async () => {
    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
        }
      }
    `;

    const variables = {
      email: testEmail,
      password: 'WrongPassword123!',
    };

    const response = await graphqlRequest(mutation, variables);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Invalid credentials should return error'
    );
  });

  await runTest('User login with non-existent email fails', async () => {
    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
        }
      }
    `;

    const variables = {
      email: 'nonexistent@example.com',
      password: 'Password123!',
    };

    const response = await graphqlRequest(mutation, variables);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Non-existent email should return error'
    );
  });

  // 4. PROTECTED ENDPOINTS - USER QUERIES
  console.log(
    `\n${colors.bright}${colors.yellow}[4] PROTECTED ENDPOINTS - USER QUERIES${colors.reset}`
  );

  await runTest('Query users without authentication fails', async () => {
    const query = `
      query {
        users {
          data {
            id
            email
          }
        }
      }
    `;

    const response = await graphqlRequest(query);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Unauthenticated request should fail'
    );
  });

  await runTest('Query users with authentication succeeds', async () => {
    const query = `
      query {
        users {
          data {
            id
            email
            firstName
            lastName
            role
          }
          total
        }
      }
    `;

    const response = await graphqlRequest(query, {}, results.authTokens.user);
    assertEquals(response.statusCode, 200, 'Users query should return 200');
    assertExists(response.body.data, 'Users query should return data');
    assertExists(response.body.data.users, 'Users query should return users');
    assertExists(response.body.data.users.data, 'Users query should return data array');
    assert(Array.isArray(response.body.data.users.data), 'Users data should be an array');
  });

  await runTest('Query users with pagination', async () => {
    const query = `
      query Users($pagination: PaginationInput) {
        users(pagination: $pagination) {
          data {
            id
            email
          }
          total
          hasMore
        }
      }
    `;

    const variables = {
      pagination: {
        limit: 2,
        offset: 0,
      },
    };

    const response = await graphqlRequest(query, variables, results.authTokens.user);
    assertEquals(response.statusCode, 200, 'Paginated users query should return 200');
    assertExists(response.body.data.users, 'Paginated query should return users');
    assert(response.body.data.users.data.length <= 2, 'Should respect pagination limit');
  });

  await runTest('Query single user by ID', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) {
          id
          email
          firstName
          lastName
          role
        }
      }
    `;

    const variables = {
      id: results.testUserId,
    };

    const response = await graphqlRequest(query, variables, results.authTokens.user);
    assertEquals(response.statusCode, 200, 'User query should return 200');
    assertExists(response.body.data.user, 'User query should return user');
    assertEquals(response.body.data.user.id, results.testUserId, 'User ID should match');
  });

  // 5. PROTECTED ENDPOINTS - DOCUMENT OPERATIONS
  console.log(
    `\n${colors.bright}${colors.yellow}[5] PROTECTED ENDPOINTS - DOCUMENT OPERATIONS${colors.reset}`
  );

  await runTest('Query documents without authentication fails', async () => {
    const query = `
      query {
        documents {
          data {
            id
            title
          }
        }
      }
    `;

    const response = await graphqlRequest(query);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Unauthenticated document query should fail'
    );
  });

  await runTest('Query documents with authentication', async () => {
    const query = `
      query {
        documents {
          data {
            id
            title
            documentNumber
            version
            status
          }
          total
        }
      }
    `;

    const response = await graphqlRequest(query, {}, results.authTokens.user);
    assertEquals(response.statusCode, 200, 'Documents query should return 200');
    assertExists(response.body.data, 'Documents query should return data');
  });

  // 6. ERROR HANDLING VALIDATION
  console.log(`\n${colors.bright}${colors.yellow}[6] ERROR HANDLING VALIDATION${colors.reset}`);

  await runTest('Invalid GraphQL syntax returns error', async () => {
    const query = `
      query {
        users {
          invalid syntax here
        }
      }
    `;

    const response = await graphqlRequest(query);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Invalid syntax should return error'
    );
  });

  await runTest('Missing required fields returns error', async () => {
    const mutation = `
      mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          token
        }
      }
    `;

    const variables = {
      email: testEmail,
      // password is missing
    };

    const response = await graphqlRequest(mutation, variables);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Missing required field should return error'
    );
  });

  await runTest('Invalid UUID format returns error', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) {
          id
          email
        }
      }
    `;

    const variables = {
      id: 'invalid-uuid-format',
    };

    const response = await graphqlRequest(query, variables, results.authTokens.user);
    assert(
      response.body.errors && response.body.errors.length > 0,
      'Invalid UUID should return error'
    );
  });

  await runTest('Malformed JSON returns error', async () => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await makeRequest(options, '{ invalid json }');
      assert(response.statusCode >= 400, 'Malformed JSON should return error status');
    } catch (e) {
      // Expected to fail
    }
  });

  // 7. RESPONSE TIME MEASUREMENTS
  console.log(`\n${colors.bright}${colors.yellow}[7] PERFORMANCE MEASUREMENTS${colors.reset}`);

  await runTest('Health endpoint responds quickly', async () => {
    const start = Date.now();
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    };

    const response = await makeRequest(options);
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200, 'Health check should succeed');
    assert(duration < 1000, `Health check should respond in under 1s (took ${duration}ms)`);
    console.log(`    Response time: ${duration}ms`);
  });

  await runTest('GraphQL query responds in reasonable time', async () => {
    const start = Date.now();
    const query = `
      query {
        users {
          data {
            id
            email
          }
          total
        }
      }
    `;

    const response = await graphqlRequest(query, {}, results.authTokens.user);
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200, 'Users query should succeed');
    assert(duration < 2000, `Query should respond in under 2s (took ${duration}ms)`);
    console.log(`    Response time: ${duration}ms`);
  });

  // FINAL REPORT
  const totalDuration = Date.now() - results.startTime;

  console.log(`\n${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║                     TEST SUMMARY                          ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.bright}Total Tests:${colors.reset} ${results.total}`);
  console.log(`${colors.green}${colors.bright}Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}${colors.bright}Failed:${colors.reset} ${results.failed}`);
  console.log(`${colors.cyan}${colors.bright}Duration:${colors.reset} ${totalDuration}ms`);

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`${colors.bright}Success Rate:${colors.reset} ${successRate}%`);

  // Health Score Calculation
  let healthScore = 100;
  healthScore -= results.failed * 3; // -3 points per failed test
  healthScore = Math.max(0, healthScore);

  const scoreColor =
    healthScore >= 90 ? colors.green : healthScore >= 70 ? colors.yellow : colors.red;
  console.log(`\n${colors.bright}${scoreColor}API Health Score: ${healthScore}/100${colors.reset}`);

  if (results.failed > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    results.tests
      .filter((t) => t.status === 'FAIL')
      .forEach((test) => {
        console.log(`  ${colors.red}❌${colors.reset} ${test.name}`);
        console.log(`     ${colors.red}${test.error}${colors.reset}`);
      });
  }

  console.log(
    `\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}\n`
  );

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
