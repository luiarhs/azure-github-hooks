const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");



app.http('AddWriteTeamToEnterprise', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`)

        const octokit = new Octokit({
            auth: '',
            baseUrl: "https://github.leneldev.com/api/v3"
        })
        
        try {

            const organizations = await octokit.request('GET /organizations', {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })
            let team;
            organizations.data.forEach(async (org) => {
                try {
                    team = await octokit.request(`POST /orgs/${org.login}/teams`, {
                        name: `${org.login}-Write`,
                        description: 'Team with write permissions to all repos',
                        permission: 'push',
                        notification_setting: 'notifications_enabled',
                        privacy: 'closed',
                        headers: {
                          'X-GitHub-Api-Version': '2022-11-28'
                        }
                    })
                    context.log(team)
                } catch (error) {
                    context.error(error)
                }
            })
            return { body: "OK" }
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
            throw error
        }
    }
});
