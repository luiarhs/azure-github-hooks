const { app } = require('@azure/functions');
const { Octokit } = require("@octokit/core");

function parseData(data) {
    // If the data is an array, return that
      if (Array.isArray(data)) {
        return data
      }
  
    // Some endpoints respond with 204 No Content instead of empty array
    //   when there is no data. In that case, return an empty array.
    if (!data) {
      return []
    }
  
    // Otherwise, the array of items that we want is in an object
    // Delete keys that don't include the array of items
    delete data.incomplete_results;
    delete data.repository_selection;
    delete data.total_count;
    // Pull out the array of items
    const namespaceKey = Object.keys(data)[0];
    data = data[namespaceKey];
  
    return data;
}

app.http('teams/', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        
        context.log(`Http function processed request for url "${request.url}"`)

        let org = request.query.get('org') || await request.text()
        let page = 1
        let members = []
        let pagesRemaining = true
        
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

            return { body: 200 }
        } catch (error) {
            context.log(`Error! Status: ${error.status}. Message: ${error.response.data.message}`)
            throw error
        }
        // const name = request.query.get('name') || await request.text() || 'world';
    }
});
