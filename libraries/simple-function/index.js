import jwt from 'jsonwebtoken';

export class RBAC {
    constructor(env) {
        this.env = env;
        this.config = {
            env: {
                dev: {
                    host: 'https://evm-rbac.staging.evermosa2z.com'
                },
            },
            path: {
                'health': '/health',
                'user': {
                    'login': '/v1/user/login',
                    'refreshToken': '/v1/user/refresh',
                    'logout': '/v1/user/logout',
                    'register': '/v1/user/register',
                },
                'subject': {
                    'authorize': '/v1/subject/authorize',
                    'refreshToken': '/v1/subject/refresh',
                    'logout': '/v1/subject/logout',
                },
            }
        }
    }
    
    /**
     * This module provides functionality to try custom lib.
     * @module JSSimpleFunction
     */

    /**
     * Asynchronously fetches health of service.
     * @function fetchJsContent
     * @returns {Promise<string>} A promise that resolves with the fetched JavaScript content as text.
     * @async
     */
    async checkHealth() {   
        let url = this.config.env[this.env].host + this.config.path.health
        try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`${response.error}`);
            }
            const json = await response.json();
            return json
          } catch (error) {
            console.error(error.message);
        }
    }
    async authorizePage(pageCode, pageSecret, tokens){
        const subjectAuth = tokens.subjectAccessToken.filter(d => d.object === pageCode)
		if (subjectAuth.length === 0) {
			return new Error(`unauthorized`);
		}
        let token = subjectAuth[0].accessToken
        let decToken = decodeToken(token)
        if (pageSecret == decToken.objectId){
            return true
        }
        try {
            let url = this.config.env[this.env].host + this.config.path.subject.authorize
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    "Content-Type":"application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer `+token
                  }
            });
            console.log(response)
            if (!response.ok) {
              throw new Error(`${response.error}`);
            }
            return true
          } catch (error) {
            console.error(error);
        }
        return false
    }
};
function decodeToken(token){
    let res = jwt.decode(token)
    return res
}

