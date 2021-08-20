import {
  EdgeFeatureHubConfig,
  ClientContext,
  Readyness,
} from 'featurehub-javascript-client-sdk';
import fetch from 'node-fetch';

if (!globalThis.fetch) {
	globalThis.fetch = fetch;
}

const buildEnvRe = /^build_env/i;


function _buildRequest(edgeUrl, apiKey, userkey, branch) {
  const url = `${edgeUrl}?sdkUrl=${apiKey}`;
  let options = {
    method: 'GET',
    headers: {
      'x-featurehub': `userkey=${userkey}&branch=${branch}`,
    },
  };
  return [url, options];
}

module.exports = {
  onPreBuild: async ({ netlifyConfig, inputs }) => {
    const buildEnvRe = new RegExp(`^${inputs.targetPrefix}`, 'i');
    const prefixReplace = inputs.prefixReplace;
    const _req = _buildRequest(inputs.edgeUrl, inputs.sdkUrl, inputs.userkey, netlifyConfig.branch)
    console.log(`Fetching Features for userkey=${inputs.userkey} branch=${netlifyConfig.branch}`)
    const response = await fetch(_req[0], _req[1]);
    const data = await response.json();
    data.forEach(function(item) {
      item.features.forEach(function(feature) {
        if (!(buildEnvRe.test(feature.key)) || !(value in feature)) {
          return
        }
        console.log(`Applying Feature ${feature.key}`)
        let env_name = feature.key.replace(buildEnvRe, prefixReplace);
        process.env[env_name.toUpperCase()] = feature.value;
      });
    });
    console.log('Finished Setting Features')
  },
}