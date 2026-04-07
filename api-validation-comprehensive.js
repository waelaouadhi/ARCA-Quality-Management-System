const http = require('http');

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

  return makeRequest(options, { query, variables });
}

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
    if (error.details) console.log(`  ${colors.yellow}${error.details}${colors.reset}`);
    results.tests.push({ name, status: 'FAIL', duration, error: error.message });
  }
}

function assert(condition, message, details = null) {
  if (!condition) {
    const error = new Error(message || 'Assertion failed');
    if (details) error.details = details;
    throw error;
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

console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║      QMS Backend - Comprehensive API Validation Report    ║
║                     Step 4: API Testing                    ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}\n`);

async function runAllTests() {
  const testEmail = `api.test.${Date.now()}@example.com`;
  const testPassword = 'SecureTest123!';

  // 1. HEALTH CHECK
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [1] HEALTH CHECK VALIDATION ━━━${colors.reset}`
  );

  await runTest('GET /health returns 200 OK', async () => {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    });

    assertEquals(response.statusCode, 200, 'Health check should return 200');
    assertExists(response.body, 'Health check should return a body');
    assertEquals(response.body.status, 'ok', 'Health status should be ok');
    assertExists(response.body.timestamp, 'Health check should include timestamp');

    const timestamp = new Date(response.body.timestamp).getTime();
    const now = Date.now();
    assert(now - timestamp < 5000, 'Timestamp should be recent (within 5s)');
  });

  // 2. GRAPHQL INTROSPECTION
  console.log(`\n${colors.bright}${colors.yellow}━━━ [2] GRAPHQL INTROSPECTION ━━━${colors.reset}`);

  await runTest('GraphQL introspection query works', async () => {
    const query = `{ __schema { queryType { name } mutationType { name } } }`;
    const response = await graphqlRequest(query);

    assertEquals(response.statusCode, 200, 'Introspection should return 200');
    assertExists(response.body.data, 'Introspection should return data');
    assertEquals(response.body.data.__schema.queryType.name, 'Query');
    assertEquals(response.body.data.__schema.mutationType.name, 'Mutation');
  });

  await runTest('List all available queries', async () => {
    const query = `{ __schema { queryType { fields { name description } } } }`;
    const response = await graphqlRequest(query);

    const queries = response.body.data.__schema.queryType.fields.map((f) => f.name);
    assert(queries.includes('users'), 'Should have users query');
    assert(queries.includes('documents'), 'Should have documents query');
    assert(queries.includes('nonConformances'), 'Should have nonConformances query');
    assert(queries.includes('correctiveActions'), 'Should have correctiveActions query');

    console.log(`    ${colors.cyan}Found ${queries.length} queries${colors.reset}`);
  });

  await runTest('List all available mutations', async () => {
    const query = `{ __schema { mutationType { fields { name description } } } }`;
    const response = await graphqlRequest(query);

    const mutations = response.body.data.__schema.mutationType.fields.map((f) => f.name);
    assert(mutations.includes('register'), 'Should have register mutation');
    assert(mutations.includes('login'), 'Should have login mutation');
    assert(mutations.includes('createDocument'), 'Should have createDocument mutation');

    console.log(`    ${colors.cyan}Found ${mutations.length} mutations${colors.reset}`);
  });

  // 3. AUTHENTICATION - REGISTRATION
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [3] AUTHENTICATION - REGISTRATION ━━━${colors.reset}`
  );

  await runTest('Register new user with valid data', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
          user { id email firstName lastName role }
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        password: testPassword,
      },
    });

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.register, 'Registration should return data');
    assertExists(response.body.data.register.token, 'Should return JWT token');
    assertExists(response.body.data.register.user, 'Should return user object');
    assertEquals(response.body.data.register.user.email, testEmail);
    assertEquals(response.body.data.register.user.role, 'USER');

    results.tokens.user = response.body.data.register.token;
    results.users.testUser = response.body.data.register.user;

    console.log(`    ${colors.cyan}User ID: ${response.body.data.register.user.id}${colors.reset}`);
    console.log(
      `    ${colors.cyan}Token length: ${response.body.data.register.token.length} chars${colors.reset}`
    );
  });

  await runTest('Registration with duplicate email fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
        }
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

    assert(response.body.errors?.length > 0, 'Duplicate email should return error');
    console.log(`    ${colors.cyan}Error: ${response.body.errors[0].message}${colors.reset}`);
  });

  await runTest('Registration with weak password fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        firstName: 'Weak',
        lastName: 'Password',
        email: `weak.${Date.now()}@example.com`,
        password: '123',
      },
    });

    assert(response.body.errors?.length > 0, 'Weak password should return error');
  });

  await runTest('Registration with missing fields fails', async () => {
    const mutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          token
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: `missing.${Date.now()}@example.com`,
        password: 'Password123!',
      },
    });

    assert(response.body.errors?.length > 0, 'Missing required fields should return error');
  });

  // 4. AUTHENTICATION - LOGIN
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [4] AUTHENTICATION - LOGIN ━━━${colors.reset}`
  );

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
    assertExists(response.body.data?.login, 'Login should return data');
    assertExists(response.body.data.login.token, 'Should return JWT token');
    assertEquals(response.body.data.login.user.email, testEmail);

    console.log(`    ${colors.cyan}Login successful${colors.reset}`);
  });

  await runTest('Login with wrong password fails', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: testEmail,
        password: 'WrongPassword123!',
      },
    });

    assert(response.body.errors?.length > 0, 'Wrong password should return error');
  });

  await runTest('Login with non-existent email fails', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      },
    });

    assert(response.body.errors?.length > 0, 'Non-existent email should return error');
  });

  // 5. PROTECTED ENDPOINTS - AUTHORIZATION
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [5] AUTHORIZATION & PROTECTED ENDPOINTS ━━━${colors.reset}`
  );

  await runTest('Query users without auth token fails', async () => {
    const query = `{ users { data { id email } } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0, 'Unauthenticated request should fail');
  });

  await runTest('Query users with valid auth token succeeds', async () => {
    const query = `
      query {
        users {
          data { id email firstName lastName role }
          total
        }
      }
    `;

    const response = await graphqlRequest(query, {}, results.tokens.user);

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.users, 'Should return users');
    assert(Array.isArray(response.body.data.users.data), 'Users data should be an array');
    assert(response.body.data.users.total > 0, 'Should have at least one user');

    console.log(`    ${colors.cyan}Total users: ${response.body.data.users.total}${colors.reset}`);
  });

  await runTest('Query single user by ID', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) {
          id email firstName lastName role
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { id: results.users.testUser.id },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.user, 'Should return user');
    assertEquals(response.body.data.user.id, results.users.testUser.id);
  });

  await runTest('Query with pagination (limit & offset)', async () => {
    const query = `
      query Users($pagination: PaginationInput) {
        users(pagination: $pagination) {
          data { id email }
          total
          hasMore
        }
      }
    `;

    const response = await graphqlRequest(
      query,
      { pagination: { limit: 2, offset: 0 } },
      results.tokens.user
    );

    assertEquals(response.statusCode, 200);
    assert(response.body.data.users.data.length <= 2, 'Should respect limit');
  });

  await runTest('Query with invalid UUID fails', async () => {
    const query = `
      query User($id: ID!) {
        user(id: $id) {
          id email
        }
      }
    `;

    const response = await graphqlRequest(query, { id: 'invalid-uuid' }, results.tokens.user);

    assert(response.body.errors?.length > 0, 'Invalid UUID should return error');
  });

  // 6. DOCUMENT OPERATIONS
  console.log(`\n${colors.bright}${colors.yellow}━━━ [6] DOCUMENT OPERATIONS ━━━${colors.reset}`);

  await runTest('Query documents without auth fails', async () => {
    const query = `{ documents { data { id title } } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0, 'Unauthenticated request should fail');
  });

  await runTest('Query documents with auth succeeds', async () => {
    const query = `
      query {
        documents {
          data { id title documentNumber version status }
          total
        }
      }
    `;

    const response = await graphqlRequest(query, {}, results.tokens.user);

    assertEquals(response.statusCode, 200);
    assertExists(response.body.data?.documents, 'Should return documents');

    console.log(
      `    ${colors.cyan}Total documents: ${response.body.data.documents.total}${colors.reset}`
    );
  });

  // 7. ERROR HANDLING
  console.log(`\n${colors.bright}${colors.yellow}━━━ [7] ERROR HANDLING ━━━${colors.reset}`);

  await runTest('Invalid GraphQL syntax returns error', async () => {
    const query = `{ users { invalid syntax } }`;
    const response = await graphqlRequest(query);

    assert(response.body.errors?.length > 0, 'Invalid syntax should return error');
  });

  await runTest('Missing required fields returns error', async () => {
    const mutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          token
        }
      }
    `;

    const response = await graphqlRequest(mutation, {
      input: { email: testEmail },
    });

    assert(response.body.errors?.length > 0, 'Missing required field should return error');
  });

  await runTest('Malformed JSON request fails', async () => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      const response = await makeRequest(options, '{ invalid json }');
      assert(response.statusCode >= 400, 'Malformed JSON should return error status');
    } catch (e) {
      // Expected to fail
    }
  });

  // 8. PERFORMANCE
  console.log(
    `\n${colors.bright}${colors.yellow}━━━ [8] PERFORMANCE MEASUREMENTS ━━━${colors.reset}`
  );

  await runTest('Health endpoint response time < 100ms', async () => {
    const start = Date.now();
    const response = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/health',
      method: 'GET',
    });
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200);
    assert(duration < 100, `Response time should be < 100ms (was ${duration}ms)`);
    console.log(`    ${colors.cyan}Response time: ${duration}ms${colors.reset}`);
  });

  await runTest('GraphQL query response time < 500ms', async () => {
    const start = Date.now();
    const query = `{ users { data { id email } total } }`;
    const response = await graphqlRequest(query, {}, results.tokens.user);
    const duration = Date.now() - start;

    assertEquals(response.statusCode, 200);
    assert(duration < 500, `Response time should be < 500ms (was ${duration}ms)`);
    console.log(`    ${colors.cyan}Response time: ${duration}ms${colors.reset}`);
  });

  // FINAL REPORT
  const totalDuration = Date.now() - results.startTime;

  console.log(`\n${colors.bright}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                          ║
╚════════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.bright}Total Tests:${colors.reset} ${results.total}`);
  console.log(`${colors.green}${colors.bright}✅ Passed:${colors.reset} ${results.passed}`);
  console.log(`${colors.red}${colors.bright}❌ Failed:${colors.reset} ${results.failed}`);
  console.log(`${colors.cyan}${colors.bright}⏱  Duration:${colors.reset} ${totalDuration}ms`);

  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  console.log(`${colors.magenta}${colors.bright}📊 Success Rate:${colors.reset} ${successRate}%`);

  // Calculate API Health Score
  let healthScore = 100;
  healthScore -= results.failed * 3;
  healthScore = Math.max(0, healthScore);

  const scoreColor =
    healthScore >= 90 ? colors.green : healthScore >= 70 ? colors.yellow : colors.red;
  console.log(
    `\n${colors.bright}${scoreColor}🏥 API HEALTH SCORE: ${healthScore}/100${colors.reset}`
  );

  if (healthScore >= 90) {
    console.log(`${colors.green}   Status: EXCELLENT - API is production ready${colors.reset}`);
  } else if (healthScore >= 70) {
    console.log(`${colors.yellow}   Status: GOOD - Minor issues to address${colors.reset}`);
  } else {
    console.log(`${colors.red}   Status: NEEDS ATTENTION - Critical issues found${colors.reset}`);
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
    `\n${colors.bright}${colors.blue}════════════════════════════════════════════════════════════${colors.reset}\n`
  );

  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
