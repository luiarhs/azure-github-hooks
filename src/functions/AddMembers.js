const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");

app.http('AddMembers', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'members/{org:alpha}',
    handler: async (request, context) => {
        
        context.log(`Http function processed request for url "${request.url}"`)

        let page = 1
        let members = []
        let pagesRemaining = true
        const org = request.params.org
        
        const octokit = new Octokit({
            auth: `${process.env["GITHUB_TOKEN"]}`,
            baseUrl: `${process.env["GITHUB_URL"]}`
        })
        
        try {
            // const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;
            while (pagesRemaining) {

                const response = await octokit.request(`GET /orgs/${org}/members?page=${page}`, {
                    per_page: 100,
                    page: page++,
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                })
                // const parsedData = parseData(response.data)
                members = [...members, ...response.data];

                const linkHeader = response.headers.link;

                pagesRemaining = linkHeader && linkHeader.includes(`rel=\"next\"`);
            }

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
        // const name = request.query.get('name') || await request.text() || 'world';
    }
});
