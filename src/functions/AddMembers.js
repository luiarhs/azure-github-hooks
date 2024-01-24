const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");

app.http('AddMembers', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'members/{org:alpha}',
    handler: async (request, context) => {
        
        context.log(`Http function processed request for url "${request.url}"`)
        
        const octokit = new Octokit({
            auth: `${process.env["GITHUB_TOKEN"]}`,
            baseUrl: `${process.env["GITHUB_URL"]}`
        })
        
        try {
            const member = await octokit.paginate(
                'GET /users', {
                    per_page: 100,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                },
                response => response.data.map(member => member)
            )

            members.forEach(async (member) => {
                try {
                    await octokit.request(`PUT /orgs/${org}/teams/${org}-Write/memberships/${member.login}`, {
                        team_slug: `${org}-Write`,
                        username: `${member.login}`,
                        role: 'member',
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
