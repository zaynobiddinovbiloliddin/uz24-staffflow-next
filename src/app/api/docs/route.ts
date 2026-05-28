import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Uz24 StaffFlow API',
    version: '1.0.0',
    description: 'O\'zbekiston 24 telekanali xodimlar boshqaruv tizimi REST API',
    contact: { name: 'Uz24 Dev Team' },
  },
  servers: [{ url: '/api', description: 'Current server' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          fullName:     { type: 'string' },
          username:     { type: 'string' },
          role:         { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'EMPLOYEE'] },
          position:     { type: 'string', nullable: true },
          phone:        { type: 'string', nullable: true },
          isActive:     { type: 'boolean' },
          departmentId: { type: 'string', nullable: true },
          createdAt:    { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id:           { type: 'string' },
          title:        { type: 'string' },
          description:  { type: 'string', nullable: true },
          status:       { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
          priority:     { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          deadline:     { type: 'string', format: 'date-time', nullable: true },
          assignedToId: { type: 'string', nullable: true },
          departmentId: { type: 'string', nullable: true },
        },
      },
      Department: {
        type: 'object',
        properties: {
          id:          { type: 'string' },
          name:        { type: 'string' },
          description: { type: 'string', nullable: true },
          color:       { type: 'string', example: '#3b82f6' },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page:  { type: 'integer' },
          limit: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
    responses: {
      Unauthorized: { description: 'Authentication required', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
      Forbidden:    { description: 'Insufficient permissions', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
      NotFound:     { description: 'Resource not found', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
      RateLimit:    { description: 'Too many requests', headers: { 'Retry-After': { schema: { type: 'integer' } } }, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } },
    },
  },
  security: [{ cookieAuth: [] }],
  paths: {
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password'], properties: { username: { type: 'string' }, password: { type: 'string', format: 'password' } } } } } },
        responses: { '200': { description: 'Login successful' }, '401': { '$ref': '#/components/responses/Unauthorized' } },
      },
    },
    '/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: { '200': { description: 'Current user', content: { 'application/json': { schema: { '$ref': '#/components/schemas/User' } } } }, '401': { '$ref': '#/components/responses/Unauthorized' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'SUPERADMIN: all users | ADMIN: only department users',
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'EMPLOYEE'] } },
          { name: 'departmentId', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { '200': { description: 'User list' }, '401': { '$ref': '#/components/responses/Unauthorized' }, '403': { '$ref': '#/components/responses/Forbidden' }, '429': { '$ref': '#/components/responses/RateLimit' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user (ADMIN+)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fullName', 'username', 'password', 'role'], properties: { fullName: { type: 'string' }, username: { type: 'string' }, password: { type: 'string' }, role: { type: 'string', enum: ['SUPERADMIN', 'ADMIN', 'EMPLOYEE'] }, position: { type: 'string' }, phone: { type: 'string' }, departmentId: { type: 'string' } } } } } },
        responses: { '201': { description: 'Created' }, '409': { description: 'Username taken' } },
      },
    },
    '/users/{id}': {
      get:    { tags: ['Users'], summary: 'Get user by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'User' }, '404': { '$ref': '#/components/responses/NotFound' } } },
      put:    { tags: ['Users'], summary: 'Update user (ADMIN+)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/User' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Users'], summary: 'Delete user (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
      patch:  { tags: ['Users'], summary: 'Toggle active status', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { action: { type: 'string', enum: ['toggle'] } } } } } }, responses: { '200': { description: 'Toggled' } } },
    },
    '/tasks': {
      get:  { tags: ['Tasks'], summary: 'List tasks', description: 'EMPLOYEE: own tasks only | ADMIN: department tasks | SUPERADMIN: all', parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] } }, { name: 'priority', in: 'query', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] } }, { name: 'search', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Task list' } } },
      post: { tags: ['Tasks'], summary: 'Create task (ADMIN+)', responses: { '201': { description: 'Created' } } },
    },
    '/tasks/{id}': {
      get:    { tags: ['Tasks'], summary: 'Get task', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Task' } } },
      put:    { tags: ['Tasks'], summary: 'Update task (EMPLOYEE: status only)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Tasks'], summary: 'Delete task (ADMIN+)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/departments': {
      get:  { tags: ['Departments'], summary: 'List departments (all roles)', responses: { '200': { description: 'Department list' } } },
      post: { tags: ['Departments'], summary: 'Create department (SUPERADMIN)', responses: { '201': { description: 'Created' } } },
    },
    '/departments/{id}': {
      put:    { tags: ['Departments'], summary: 'Update department (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Departments'], summary: 'Delete department (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/schedules': {
      get:  { tags: ['Schedules'], summary: 'List schedules', description: 'EMPLOYEE: own | ADMIN/SUPERADMIN: filtered by userId, date range', parameters: [{ name: 'from', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } }, { name: 'userId', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Schedule list' } } },
      post: { tags: ['Schedules'], summary: 'Create schedule (ADMIN+)', responses: { '201': { description: 'Created' } } },
    },
    '/schedules/{id}': {
      put:    { tags: ['Schedules'], summary: 'Update schedule (ADMIN+)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Schedules'], summary: 'Delete schedule (ADMIN+)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/equipment': {
      get:  { tags: ['Equipment'], summary: 'List equipment', parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN'] } }], responses: { '200': { description: 'Equipment list' } } },
      post: { tags: ['Equipment'], summary: 'Add equipment (ADMIN+)', responses: { '201': { description: 'Created' } } },
    },
    '/equipment/{id}': {
      put:    { tags: ['Equipment'], summary: 'Update equipment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      patch:  { tags: ['Equipment'], summary: 'Assign/unassign equipment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { assignedToId: { type: 'string', nullable: true } } } } } }, responses: { '200': { description: 'Assigned' } } },
      delete: { tags: ['Equipment'], summary: 'Delete equipment (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/vehicles': {
      get:  { tags: ['Vehicles'], summary: 'List vehicles', parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE'] } }], responses: { '200': { description: 'Vehicle list' } } },
      post: { tags: ['Vehicles'], summary: 'Add vehicle (ADMIN+)', responses: { '201': { description: 'Created' } } },
    },
    '/vehicles/{id}': {
      put:    { tags: ['Vehicles'], summary: 'Update vehicle', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      patch:  { tags: ['Vehicles'], summary: 'Assign/unassign vehicle', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Assigned' } } },
      delete: { tags: ['Vehicles'], summary: 'Delete vehicle (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/payroll': {
      get:  { tags: ['Payroll'], summary: 'List payroll', description: 'EMPLOYEE: own | SUPERADMIN/ADMIN: filtered', parameters: [{ name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12 } }, { name: 'year', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Payroll list' } } },
      post: { tags: ['Payroll'], summary: 'Create payroll entry (SUPERADMIN)', responses: { '201': { description: 'Created' } } },
    },
    '/payroll/{id}': {
      patch:  { tags: ['Payroll'], summary: 'Mark as paid (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { action: { type: 'string', enum: ['pay'] } } } } } }, responses: { '200': { description: 'Paid' } } },
      delete: { tags: ['Payroll'], summary: 'Delete payroll entry (SUPERADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/notifications': {
      get: { tags: ['Notifications'], summary: 'Get my notifications', parameters: [{ name: 'unread', in: 'query', schema: { type: 'boolean' } }], responses: { '200': { description: 'Notifications' } } },
    },
    '/notifications/{id}': {
      patch:  { tags: ['Notifications'], summary: 'Mark notification read', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { action: { type: 'string', enum: ['read'] } } } } } }, responses: { '200': { description: 'Marked read' } } },
      delete: { tags: ['Notifications'], summary: 'Delete notification', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '204': { description: 'Deleted' } } },
    },
    '/notifications/all': {
      patch: { tags: ['Notifications'], summary: 'Mark all as read', responses: { '200': { description: 'All read' } } },
    },
    '/analytics': {
      get: { tags: ['Analytics'], summary: 'Analytics data (ADMIN+)', parameters: [{ name: 'type', in: 'query', required: true, schema: { type: 'string', enum: ['overview', 'tasks-chart', 'departments'] } }], responses: { '200': { description: 'Analytics' } } },
    },
    '/audit-logs': {
      get: { tags: ['Audit Logs'], summary: 'Audit log (SUPERADMIN)', parameters: [{ name: 'entity', in: 'query', schema: { type: 'string' } }, { name: 'action', in: 'query', schema: { type: 'string' } }, { name: 'userId', in: 'query', schema: { type: 'string' } }, { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }, { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } }], responses: { '200': { description: 'Audit logs with pagination' } } },
    },
    '/docs': {
      get: { tags: ['Docs'], summary: 'OpenAPI JSON spec', security: [], responses: { '200': { description: 'OpenAPI 3.0 specification' } } },
    },
    '/docs/ui': {
      get: { tags: ['Docs'], summary: 'Swagger UI', security: [], responses: { '200': { description: 'Swagger UI HTML' } } },
    },
  },
};

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(spec, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
}
