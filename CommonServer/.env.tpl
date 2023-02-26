ONEUPTIME_SECRET={{ .Env.ONEUPTIME_SECRET }}

DATABASE_PORT={{ .Env.DATABASE_PORT }}
DATABASE_USERNAME={{ .Env.DATABASE_USERNAME }}
DATABASE_PASSWORD={{ .Env.DATABASE_PASSWORD }}
DATABASE_NAME={{ .Env.DATABASE_NAME }}
DATABASE_HOST={{ .Env.DATABASE_HOST }}

REDIS_PASSWORD={{ .Env.REDIS_PASSWORD }}
REDIS_HOST={{ .Env.REDIS_HOST }}
REDIS_PORT={{ .Env.REDIS_PORT }}

ENCRYPTION_SECRET={{ .Env.ENCRYPTION_SECRET }}
DISABLE_SIGNUP={{ .Env.DISABLE_SIGNUP }}

REALTIME_HOSTNAME={{ .Env.REALTIME_HOSTNAME }}
MAIL_HOSTNAME={{ .Env.MAIL_HOSTNAME }}
DASHBOARD_HOSTNAME=d{{ .Env.DASHBOARD_HOSTNAME }}
DASHBOARD_API_HOSTNAME={{ .Env.DASHBOARD_API_HOSTNAME }}
PROBE_API_HOSTNAME={{ .Env.DATA_INGESTOR_HOSTNAME }}
DATA_INGESTOR_HOSTNAME={{ .Env.DATA_INGESTOR_HOSTNAME }}
ACCOUNTS_HOSTNAME={{ .Env.ACCOUNTS_HOSTNAME }}
HOME_HOSTNAME={{ .Env.HOME_HOSTNAME }}
WORKER_HOSTNAME={{ .Env.WORKER_HOSTNAME }}
WORKFLOW_HOSTNAME={{ .Env.WORKFLOW_HOSTNAME }}

BILLING_PRIVATE_KEY={{ .Env.BILLING_PRIVATE_KEY }}
BILLING_PUBLIC_KEY={{ .Env.BILLING_PUBLIC_KEY }}
BILLING_ENABLED={{ .Env.BILLING_ENABLED }}

DOMAIN={{ .Env.DOMAIN }}
HTTP_PROTOCOL={{ .Env.HTTP_PROTOCOL }}

REALTIME_ROUTE={{ .Env.REALTIME_ROUTE }}
MAIL_ROUTE={{ .Env.MAIL_ROUTE }}
DASHBOARD_ROUTE={{ .Env.DASHBOARD_ROUTE }}
DASHBOARD_API_ROUTE={{ .Env.DASHBOARD_API_ROUTE }}
PROBE_API_ROUTE={{ .Env.PROBE_API_ROUTE }}
DATA_INGESTOR_ROUTE={{ .Env.DATA_INGESTOR_ROUTE }}
ACCOUNTS_ROUTE={{ .Env.ACCOUNTS_ROUTE }}
HOME_ROUTE={{ .Env.HOME_ROUTE }}
HELMCHARTS_ROUTE={{ .Env.HELMCHARTS_ROUTE }}
APIDOCS_ROUTE={{ .Env.APIDOCS_ROUTE }}
IDENTITY_ROUTE={{ .Env.IDENTITY_ROUTE }}
FILE_ROUTE={{ .Env.FILE_ROUTE }}
WORKFLOW_ROUTE={{ .Env.WORKFLOW_ROUTE }}
STATUS_PAGE_ROUTE={{ .Env.STATUS_PAGE_ROUTE }}

IS_SERVER=true

ANALYTICS_KEY={{ .Env.ANALYTICS_KEY }}
ANALYTICS_HOST={{ .Env.ANALYTICS_HOST }}