import { config } from 'motia'

const statesPlugin = require('@motiadev/plugin-states/plugin')
const endpointPlugin = require('@motiadev/plugin-endpoint/plugin')
const logsPlugin = require('@motiadev/plugin-logs/plugin')
const observabilityPlugin = require('@motiadev/plugin-observability/plugin')

export default config({
  
  // Built-in Workbench plugins
  plugins: [observabilityPlugin, statesPlugin, endpointPlugin, logsPlugin],
})

