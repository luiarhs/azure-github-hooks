const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");

app.http('UpdateWriteTeams', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`)

        const octokit = new Octokit({
            auth: `${process.env["GITHUB_TOKEN"]}`,
            baseUrl: `${process.env["GITHUB_URL"]}`
        })
        
        try {

            const organizations = await octokit.request('GET /organizations', {
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            organizations.data.forEach(async (org) => {
                try {
                    await octokit.request(`PATCH /orgs/${org.login}/teams/${org.login}-Write`, {
                        notification_setting: 'notifications_disabled',
                        headers: {
                          'X-GitHub-Api-Version': '2022-11-28'
                        }
                    })
                } catch (error) {
                    context.error(error)
                }
            })
            return { status: 200 }
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
            throw error
        }
    }
});
