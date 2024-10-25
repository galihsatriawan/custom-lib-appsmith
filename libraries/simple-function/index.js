export default {
	state: {
		env: 'dev',
		storeValue: Function,
		navigateTo: Function,
		clearStore: Function,
		showAlert: Function,
	},
	field: {
		token: "tokens"
	},
	config: {
		env: {
			'dev': {
				'host': 'https://evm-rbac.staging.evermosa2z.com'
			}
		},
		path: {
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
	},
	setState(env, storeValueFunc, navigateToFunc, clearStoreFunc, showAlertFunc) {
		this.state.env = env
		this.state.storeValue = storeValueFunc
		this.state.navigateTo = navigateToFunc
		this.state.clearStore = clearStoreFunc
		this.state.showAlert = showAlertFunc
	},
	decodeToken(token) {
		let res = jsonwebtoken.decode(token)
		return res
	},

	async login(username, password) {
		let url = this.config.env[this.state.env].host + this.config.path.user.login
		return await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				username: username,
				password: password,
			}),
		}).then(async (response) => {
			let json = await response.json()
			if (json.statusCode === 200) {
				this.state.storeValue(this.field.token, json.data)
				return json.data
			}
			throw new Error(json.error);
		}).catch((error) => {
			throw new Error(`${error.message}`);
		});
	},
	async register(username, password, appName, merchantCode) {
		let url = this.config.env[this.state.env].host + this.config.path.user.register
		return await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				"username": username,
				"password": password,
				"appName": appName,
				"merchantCode": merchantCode
			}),
		}).then(async (response) => {
			let json = await response.json()
			if (json.statusCode === 201) {
				return json.data
			}
			throw new Error(json.error);
		}).catch((error) => {
			throw new Error(`${error.message}`);
		});
	},
	composeHeaderAuthorization(token) {
		return {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": `Bearer ` + token
		}
	},
	async authorizePage(pageCode, pageSecret, appsmithData) {
		const subjectAuth = appsmithData.tokens.subjectAccessToken.filter(d => d.object === pageCode)
		console.log(subjectAuth)
		if (subjectAuth.length === 0) {
			return false
		}
		let token = subjectAuth[0].accessToken
		let decToken = this.decodeToken(token)

		if (pageSecret != decToken.objectId) {
			return false
		}
		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.authorize

			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			if (!response.ok) {
				throw new Error(`${response.error}`);
			}
			return true
		} catch (error) {
			throw new Error(`${error.message}`);
		}
		return false
	},
	async logout(token) {
		try {
			let url = this.config.env[this.state.env].host + this.config.path.user.logout
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			if (!response.ok) {
				throw new Error(`${response.error}`);
			}
			this.state.clearStore(this.field.token)
			return "success"
		} catch (error) {
			throw new Error(`${error.message}`);
		}
	},

	async refreshToken(tokens) {
		try {
			let url = this.config.env[this.state.env].host + this.config.path.user.refreshToken
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(tokens.refreshToken)
			});
			if (!response.ok) {
				throw new Error(`${response.error}`);
			}
			let json = await response.json()
			if (json.statusCode === 200) {
				tokens.accessToken = json.data.accessToken
				tokens.refreshToken = json.data.refreshToken
				this.state.storeValue(this.field.token, tokens)
				return json.data
			}
			throw new Error(json.error);
		} catch (error) {
			throw new Error(`${error.message}`);
		}
	},

	async subjectLogout(token) {
		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.logout
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			if (!response.ok) {
				throw new Error(`${response.error}`);
			}
			return true
		} catch (error) {
			throw new Error(`${error.message}`);
		}
		return false
	},
	async subjectRefreshToken(token, tokens) {
		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.refreshToken
			let subjectTokenIndex = -1
			for (let index = 0; index < tokens.subjectAccessToken; index++) {
				if (tokens.subjectAccessToken[index].refreshToken==token){
					subjectTokenIndex = index
					break
				}
			}
			
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			if (!response.ok) {
				throw new Error(`${response.error}`);
			}
			let json = await response.json()
			if (json.statusCode === 200) {
				if (subjectTokenIndex != -1){
					tokens.subjectAccessToken[subjectTokenIndex].accessToken = json.data.accessToken
					tokens.subjectAccessToken[subjectTokenIndex].refreshToken = json.data.refreshToken
				}else{
					tokens.subjectAccessToken.push(json.data)
				}
				this.state.storeValue(this.field.token, tokens)
				return json.data
			}
			throw new Error(json.error);
		} catch (error) {
			throw new Error(`${error.message}`);
		}
	},
}