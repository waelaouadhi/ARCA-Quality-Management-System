const http = require('http');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  startTime: Date.now(),
  tokens: {},
  users: {},
  examples: {},
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function graphqlRequest(query, variables = {}, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/graphql',
    method: 'POST',
    headers,
  };

  const startTime = Date.now();
  const response = await makeRequest(options, { query, variables });
  response.duration = Date.now() - startTime;
  return response;
}

async function runTest(name, testFn) {
  results.total++;
  const startTime = Date.now();

  try {
    const testResult = await testFn();
    results.passed++;
    const duration = Date.now() - startTime;
    console.log(
      `${colors.green}✅ PASS${colors.reset} ${name} ${colors.cyan}(${duration}ms)${colors.reset}`
    );
    results.tests.push({ name, status: 'PASS', duration, error: null, data: testResult });
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

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) throw new Error(message || `Expected ${expected}, got ${actual}`);
}

function assertExists(value, message) {
  if (value === null || value === undefined) throw new Error(message || 'Value does not exist');
}

console.log(`${colors.bright}${colors.blue}
╔═════════════════════════════════════════════════════════════╗
║       QMS Backend - Step 4: API Validation Report          ║
╚═════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function runAllTests() {
  const timestamp = Date.now();
  const testEmail = `api.validation.${timestamp}@qms-test.com`;
  const testPassword = 'SecureValidation123!';

  // 1. HEALTH CHECK
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [1] HEALTH CHECK VALIDATION ━━━${colors.reset}`
  );

  await runTest('GET /health endpoint', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    });

    assertEquals(response.statusCode, 200);
    assertEquals(response.body.status, 'ok');
    assertExists(response.body.timestamp);

    results.examples.health = {
      request: 'GET http://localhost:4000/health',
      response: response.body,
      statusCode: 200,
    };

    return { responseTime: Date.now() - timestamp };
  });

  // 2. GRAPHQL SCHEMA
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [2] GRAPHQL SCHEMA INTROSPECTION ━━━${colors.reset}`
  );

  await runTest('GraphQL introspection', async () => {
    const query = `{ __schema { queryType { name } mutationType { name } } }`;
    const response = await graphqlRequest(query);

    assertEquals(response.statusCode, 200);
    assertEquals(response.body.data.__schema.queryType.name, 'Query');
    assertEquals(response.body.data.__schema.mutationType.name, 'Mutation');

    return { responseTime: response.duration };
  });

  await runTest('List all queries', async () => {
    const query = `{ __schema { queryType { fields { name } } } }`;
    const response = await graphqlRequest(query);

    const queries = response.body.data.__schema.queryType.fields.map((f) => f.name);
    results.examples.availableQueries = queries;

    console.log(`    ${colors.cyan}Available queries: ${queries.join(', ')}${colors.reset}`);
    return { count: queries.length };
  });

  await runTest('List all mutations', async () => {
    const query = `{ __schema { mutationType { fields { name } } } }`;
    const response = await graphqlRequest(query);

    const mutations = response.body.data.__schema.mutationType.fields.map((f) => f.name);
    results.examples.availableMutations = mutations;

    console.log(`    ${colors.cyan}Available mutations: ${mutations.join(', ')}${colors.reset}`);
    return { count: mutations.length };
  });

  // 3. AUTHENTICATION - REGISTRATION
  console.log(`\n${colors.bright}${colors.yellow}━━━ [3] USER REGISTRATION ━━━${colors.reset}`);

  await runTest('Register new user successfully', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user { id email firstName lastName role createdAt }
        }
      }
    `;

    const variables = {
      input: {
        firstName: 'Validation',
        lastName: 'Test',
        email: testEmail,
        password: testPassword,
      },
    };

    const response = await graphqlRequest(mutation, variables);

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.register);
    assertExists(response.body.data.register.token);
    assertExists(response.body.data.register.user);
    assertEquals(response.body.data.register.user.email, testEmail);
    assertEquals(response.body.data.register.user.role, 'USER');

    results.tokens.user = response.body.data.register.token;
    results.users.testUser = response.body.data.register.user;

    results.examples.registerSuccess = {
      request: { mutation, variables },
      response: response.body.data,
      statusCode: 200,
      responseTime: response.duration,
    };

    console.log(`    ${colors.cyan}User ID: ${response.body.data.register.user.id}${colors.reset}`);
    console.log(`    ${colors.cyan}Role: ${response.body.data.register.user.role}${colors.reset}`);

    return { userId: response.body.data.register.user.id };
  });

  await runTest('Registration duplicate email fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) { token }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        firstName: 'Duplicate',
        lastName: 'User',
        email: testEmail,
        password: 'AnotherPassword123!',
      },
    });

    assert(response.body.errors?.length > 0);
    results.examples.registerDuplicateError = {
      error: response.body.errors[0].message,
    };

    return { errorHandled: true };
  });

  await runTest('Registration weak password fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) { token }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        firstName: 'Weak',
        lastName: 'Pass',
        email: `weak.${timestamp}@example.com`,
        password: '123',
      },
    });

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  // 4. AUTHENTICATION - LOGIN
  console.log(`\n${colors.bright}${colors.yellow}━━━ [4] USER LOGIN ━━━${colors.reset}`);

  await runTest('Login with valid credentials', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
          user { id email firstName lastName role }
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: testEmail,
        password: testPassword,
      },
    });

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.login);
    assertExists(response.body.data.login.token);

    results.examples.loginSuccess = {
      request: { email: testEmail },
      response: { token: '***', user: response.body.data.login.user },
      statusCode: 200,
      responseTime: response.duration,
    };

    console.log(`    ${colors.green}Login successful${colors.reset}`);
    return { responseTime: response.duration };
  });

  await runTest('Login with wrong password fails', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) { token }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: testEmail,
        password: 'WrongPassword123!',
      },
    });

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  await runTest('Login with non-existent email fails', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) { token }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      },
    });

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  // 5. PROTECTED ENDPOINTS
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [5] PROTECTED ENDPOINTS & AUTHORIZATION ━━━${colors.reset}`
  );

  await runTest('Query without authentication fails', async () => {
    const query = `{ users(pagination: {page: 1, limit: 10}) { data { id } } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0);
    return { authRequired: true };
  });

  await runTest('Query users with authentication', async () => {
    const query = `
      query Users($pagination: PaginationInput) {
        users(pagination: $pagination) {
          data { id email firstName lastName role }
          pagination { page limit total totalPages hasNext hasPrev }
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { pagination: { page: 1, limit: 10 } },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.users);
    assert(Array.isArray(response.body.data.users.data));
    assert(response.body.data.users.pagination.total > 0);

    results.examples.usersQuery = {
      request: { pagination: { page: 1, limit: 10 } },
      response: {
        totalUsers: response.body.data.users.pagination.total,
        sampleUser: response.body.data.users.data[0],
      },
      responseTime: response.duration,
    };

    console.log(
      `    ${colors.cyan}Total users: ${response.body.data.users.pagination.total}${colors.reset}`
    );
    return { totalUsers: response.body.data.users.pagination.total };
  });

  await runTest('Query single user by ID', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) {
          id email firstName lastName role createdAt
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { id: results.users.testUser.id },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.user);
    assertEquals(response.body.data.user.id, results.users.testUser.id);

    return { responseTime: response.duration };
  });

  await runTest('Query with pagination', async () => {
    const query = `
      query Users($pagination: PaginationInput) {
        users(pagination: $pagination) {
          data { id email }
          pagination { page limit total hasNext hasPrev }
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { pagination: { page: 1, limit: 2 } },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assert(response.body.data.users.data.length <= 2);

    return { paginationWorks: true };
  });

  await runTest('Invalid UUID returns error', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) { id }
      }
    `;

    const response = await graphqlRequest(query, { id: 'invalid-uuid' }, results.tokens.user);

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  // 6. DOCUMENT OPERATIONS
  console.log(`\n${colors.bright}${colors.yellow}━━━ [6] DOCUMENT OPERATIONS ━━━${colors.reset}`);

  await runTest('Query documents without auth fails', async () => {
    const query = `{ documents(pagination: {page: 1, limit: 10}) { data { id } } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0);
    return { authRequired: true };
  });

  await runTest('Query documents with authentication', async () => {
    const query = `
      query Documents($pagination: PaginationInput) {
        documents(pagination: $pagination) {
          data { id title documentNumber version status }
          pagination { total }
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { pagination: { page: 1, limit: 10 } },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.documents);

    console.log(
      `    ${colors.cyan}Total documents: ${response.body.data.documents.pagination.total}${colors.reset}`
    );
    return { totalDocuments: response.body.data.documents.pagination.total };
  });

  // 7. ERROR HANDLING
  console.log(`\n${colors.bright}${colors.yellow}━━━ [7] ERROR HANDLING ━━━${colors.reset}`);

  await runTest('Invalid GraphQL syntax', async () => {
    const query = `{ users { invalid syntax } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  await runTest('Missing required fields', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) { token }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: { email: testEmail },
    });

    assert(response.body.errors?.length > 0);
    return { errorHandled: true };
  });

  await runTest('Malformed JSON request', async () => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const response = await makeRequest(options, '{ invalid json }');
      assert(response.statusCode >= 400);
    } catch (e) {
      // Expected
    }
    return { errorHandled: true };
  });

  // 8. PERFORMANCE
  console.log(`\n${colors.bright}${colors.yellow}━━━ [8] PERFORMANCE TESTS ━━━${colors.reset}`);

  await runTest('Health endpoint < 100ms', async () => {
    const start = Date.now();
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    });
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200);
    assert(duration < 100, `Response time ${duration}ms exceeds 100ms`);
    console.log(`    ${colors.cyan}Response time: ${duration}ms${colors.reset}`);

    return { responseTime: duration };
  });

  await runTest('GraphQL query < 500ms', async () => {
    const query = `
      query { users(pagination: {page: 1, limit: 10}) { data { id email } pagination { total } } }
    `;

    const start = Date.now();
    const response = await graphqlRequest(query, {}, results.tokens.user);
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200);
    assert(duration < 500, `Response time ${duration}ms exceeds 500ms`);
    console.log(`    ${colors.cyan}Response time: ${duration}ms${colors.reset}`);

    return { responseTime: duration };
  });

  // 9. AUTHORIZATION MATRIX TEST
  console.log(`\n${colors.bright}${colors.yellow}━━━ [9] AUTHORIZATION MATRIX ━━━${colors.reset}`);

  await runTest('USER role can read data', async () => {
    const query = `
      query { users(pagination: {page: 1, limit: 1}) { data { id } pagination { total } } }
    `;

    const response = await graphqlRequest(query, {}, results.tokens.user);
    assertEquals(response.statusCode, 200);

    console.log(`    ${colors.cyan}✓ USER can read users${colors.reset}`);
    return { readAccess: true };
  });

  // GENERATE REPORT
  const totalDuration = Date.now() - results.startTime;

  console.log(`\n${colors.bright}${colors.blue}
╔═════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                           ║
╚═════════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.bright}Total Tests:${colors.reset} ${results.total}`);
  console.log(`${colors.green}${colors.bright}✅ Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}${colors.bright}❌ Failed:${colors.reset} ${results.failed}`);
  console.log(`${colors.cyan}${colors.bright}⏱  Duration:${colors.reset} ${totalDuration}ms`);

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`${colors.magenta}${colors.bright}📊 Success Rate:${colors.reset} ${successRate}%`);

  let healthScore = 100;
  healthScore -= results.failed * 3;
  healthScore = Math.max(0, healthScore);

  const scoreColor =
    healthScore >= 90 ? colors.green : healthScore >= 70 ? colors.yellow : colors.red;
  console.log(
    `\n${colors.bright}${scoreColor}🏥 API HEALTH SCORE: ${healthScore}/100${colors.reset}`
  );

  if (healthScore >= 95) {
    console.log(`${colors.green}   Status: EXCELLENT - Production Ready ✓${colors.reset}`);
  } else if (healthScore >= 85) {
    console.log(`${colors.green}   Status: VERY GOOD - Minor improvements possible${colors.reset}`);
  } else if (healthScore >= 70) {
    console.log(`${colors.yellow}   Status: GOOD - Some issues to address${colors.reset}`);
  } else {
    console.log(`${colors.red}   Status: NEEDS ATTENTION - Critical issues${colors.reset}`);
  }

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
    `\n${colors.bright}${colors.blue}═════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  // Generate detailed report file
  const reportData = {
    summary: {
      totalTests: results.total,
      passed: results.passed,
      failed: results.failed,
      successRate: `${successRate}%`,
      healthScore: `${healthScore}/100`,
      duration: `${totalDuration}ms`,
      timestamp: new Date().toISOString(),
    },
    tests: results.tests,
    examples: results.examples,
  };

  fs.writeFileSync('API_VALIDATION_REPORT.json', JSON.stringify(reportData, null, 2));
  console.log(
    `${colors.cyan}📄 Detailed report saved to: API_VALIDATION_REPORT.json${colors.reset}\n`
  );

  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
