export default {
	/**
	 * This module provides functionality to integrate a service.
	 * @module RBAC
	 */


	state: {
		hasSetState: false,
		env: 'dev',
		applicationInfo: undefined, // example: {'appId': 'xxxx', 'appName': 'xxxx'}
		pages: undefined, // example: {'object-code':{'id': 'object-id', 'code' : 'object-code', 'pageName': 'page-name'}}
		useRefreshToken: false,
		storeValue: async () => { },
		navigateTo: async () => { },
		clearStore: async () => { },
		showAlert: async () => { },
	},
	field: {
		token: "tokens",
		userInfo: "userInfo",
		oauthState: "oauthState",
		authorizedPage: "authorizedPages",
	},
	errorConst: {
		unexpectedError: {
			code: 'unexpectedError',
			message: 'Unexpected error'
		},
		unauthorizedUser: {
			code: 'EVAC4007',
			message: 'unauthorized user'
		},
		forbiddenAction: {
			code: 'EVAC6007',
			message: 'forbidden action'
		},
		requiredPageData: {
			code: 'EVAC6008',
			message: 'required page data'
		},
		requiredSetStateData: {
			code: 'EVAC6009',
			message: 'state data is required to be set'
		},
		requiredApplicationData: {
			code: 'EVAC6010',
			message: 'required application data'
		},
		tokenExpired: {
			code: 'EVAC4008',
			message: 'token has expired'
		},
	},
	config: {
		env: {
			fb: {
				host: 'https://api-fb.evermosa2z.com/rbac-fb'
			},
			dev: {
				host: 'http://evm-rbac.dev.internal'
			},
		},
		path: {
			user: {
				login: '/v1/user/login',
				refreshToken: '/v1/user/refresh',
				logout: '/v1/user/logout',
				register: '/v1/user/register',
				info: '/v1/user/info',
			},
			subject: {
				authorize: '/v1/subject/authorize',
				refreshToken: '/v1/subject/refresh',
				logout: '/v1/subject/logout',
				assignSubject: '/v1/subject/role',
				unassignSubject: '/v1/subject/role',
				list: '/v1/subject/list',
			},
			application: {
				authorize : '/v1/application/{id}/oauth/authorize'
			},
			oauth: {
				exchangeToken: '/v1/provider/oauth/exchange-token'
			}
		}
	},


	/**
	 * Set several dependency data or internal functions in Appsmith.
	 * @function setState
	 * @param {string} env - Environment of service (dev or production).
	 * @param {Function} storeValueFunc - Store the value in storage.
	 * @param {Function} navigateToFunc - Navigate to another page.
	 * @param {Function} clearStoreFunc - Clear the value from storage.
	 * @param {Function} showAlertFunc  - Show an alert on the dashboard.
	 */
	setState(env, storeValueFunc, navigateToFunc, clearStoreFunc, showAlertFunc, useRefreshToken = false) {
		this.state.hasSetState = true
		this.state.env = env
		this.state.storeValue = storeValueFunc
		this.state.navigateTo = navigateToFunc
		this.state.clearStore = clearStoreFunc
		this.state.showAlert = showAlertFunc
		this.state.useRefreshToken = useRefreshToken
		return this
	},
	setPages(pages) {
		this.state.pages = pages
		return this
	},
	setApplication(applicationInfo) {
		this.state.applicationInfo = applicationInfo
		return this
	},
	setUseRefreshToken(useRefreshToken) {
		this.state.useRefreshToken = useRefreshToken
		return this
	},
	/**
	 * Decode JWT token.
	 * @function decodeToken
	 * @param {string} token - The JWT Token.
	 * @returns {object} An object containing the parsed JWT Token.
	 */
	decodeToken(token) {
		let res = jsonwebtoken.decode(token)
		return res
	},
	checkPrerequisiteFunction(params = { needPageData: false, needApplicationData: false, needToken: false }) {
		if (!this.state.hasSetState) {
			return this.wrapResult(this.newError(this.errorConst.requiredSetStateData.code, this.errorConst.requiredSetStateData.message), true)
		}
		if (this.state.pages == undefined && params.needPageData !== undefined && params.needPageData) {
			return this.wrapResult(this.newError(this.errorConst.requiredPageData.code, this.errorConst.requiredPageData.message), true)
		}
		if (params.needToken && !appsmith.store.tokens){
			return this.wrapResult(this.newError(this.errorConst.tokenExpired.code, this.errorConst.tokenExpired.message), true)
		}
		if (this.state.applicationInfo == undefined && params.needApplicationData !== undefined && params.needApplicationData) {
			return this.wrapResult(this.newError(this.errorConst.requiredApplicationData.code, this.errorConst.requiredApplicationData.message), true)
		}
		return this.wrapResult(true)
	},
	wrapResult(data, isError = false) {
		if (isError) {
			return {
				code: data.errorCode,
				error: data.error
			}
		}
		return {
			data: data
		}
	},
	newError(errorCode, message) {
		return {
			errorCode: errorCode,
			error: message
		}
	},
	composeHeaderExchangeToken(exchangeToken) {
		return {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": exchangeToken,
		}
	},
	composeHeaderAuthorization(token) {
		return {
			"Content-Type": "application/json",
			"Accept": "application/json",
			"Authorization": `Bearer ` + token
		}
	},
	getFirstAuthorizedPage() {
		for (const key in appsmith.store.authorizedPages) {
			let authorizedPage = appsmith.store.authorizedPages[key]
			return authorizedPage
		}
		return this.wrapResult(this.newError(this.errorConst.forbiddenAction.code, this.errorConst.forbiddenAction.message), true)
	},

	async setAuthorizedPage(tokens) {
		let authorizedPages = {}
		if (tokens.subjectAccessToken == undefined) {
			await this.state.storeValue(this.field.authorizedPage, authorizedPages)
			return authorizedPages
		}
		for (const key in tokens.subjectAccessToken) {
			let subjectAccessToken = tokens.subjectAccessToken[key]
			if (this.state.pages[subjectAccessToken.object]) {
				let page = this.state.pages[subjectAccessToken.object]

				let decodedToken = this.decodeToken(subjectAccessToken.accessToken)
				if (page.id == decodedToken.objectId) {
					authorizedPages[page.code] = page
				}
			}
		}
		await this.state.storeValue(this.field.authorizedPage, authorizedPages)
		return authorizedPages
	},

	/**
	 * Login user to rbac service.
	 * @function login
	 * @param {string} username - The user's username.
	 * @param {string} password - The user's password.
	 * @returns {object} An object containing the parsed JWT Token.
	 * @async
	 */
	async login(username, password) {
		let checkResult = this.checkPrerequisiteFunction({ needPageData: true })
		if (checkResult.error) {
			return checkResult
		}
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
				await this.state.storeValue(this.field.token, json.data)
				await this.setAuthorizedPage(json.data)
				await this.getUserInfo()
				return this.wrapResult(json.data)
			}
			return this.wrapResult(this.newError(json.errorCode, json.error), true)
		}).catch((error) => {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		});
	},
	async register(username, password, appName, merchantCode) {
		let checkResult = this.checkPrerequisiteFunction()
		if (checkResult.error) {
			return checkResult
		}
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
				return this.wrapResult(json.data)
			}
			return this.wrapResult(this.newError(json.errorCode, json.error), true)
		}).catch((error) => {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		});
	},
	async authorizePage(pageCode, pageSecret) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		let tokens = appsmith.store.tokens
		const subjectAuths = tokens.subjectAccessToken.filter(d => {
			let decToken = this.decodeToken(d.accessToken)
			return (d.object === pageCode && pageSecret == decToken.objectId)
		})

		if (subjectAuths.length === 0) {
			return this.wrapResult(
				this.newError(this.errorConst.forbiddenAction.code, this.errorConst.forbiddenAction.message), true
			)
		}
		let token = subjectAuths[0].accessToken
		let refreshToken = subjectAuths[0].refreshToken

		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.authorize

			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				if (this.state.useRefreshToken && json.errorCode == this.errorConst.tokenExpired.code) {
					let refreshTokenResult = await this.subjectRefreshToken(refreshToken)
					if (refreshTokenResult.error) {
						if (refreshTokenResult.code == this.errorConst.tokenExpired.code) {
							await this.state.clearStore(this.field.token)
						}
						return this.wrapResult(this.newError(refreshTokenResult.code, refreshTokenResult.error), true)
					}
					const response = await fetch(url, {
						method: 'POST',
						headers: this.composeHeaderAuthorization(refreshTokenResult.data.accessToken)
					});
					let json = await response.json()
					if (json.statusCode != 200) {
						return this.wrapResult(this.newError(json.errorCode, json.error), true)
					}
					return this.wrapResult(true)
				}
				if (json.errorCode == this.errorConst.tokenExpired.code) {
					await this.state.clearStore(this.field.token)
				}
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(true)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async logout() {
		let checkResult = this.checkPrerequisiteFunction()
		if (checkResult.error) {
			return checkResult
		}
		let tokens = appsmith.store.tokens
		if (!tokens) {
				return this.wrapResult("success")
		}
		try {
			let url = this.config.env[this.state.env].host + this.config.path.user.logout
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.accessToken)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				await this.state.clearStore(this.field.token)
				await this.state.clearStore(this.field.userInfo)
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			await this.state.clearStore(this.field.token)
			await this.state.clearStore(this.field.userInfo)
			return this.wrapResult("success")
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async exchangeToken(exchangeToken) {
		let checkResult = this.checkPrerequisiteFunction()
		if (checkResult.error) {
			return checkResult
		}
		
		try {
			let url = this.config.env[this.state.env].host + this.config.path.oauth.exchangeToken

			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderExchangeToken(exchangeToken),
				body: {},
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			await storeValue(this.field.token, json.data)
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async getUserInfo() {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}

		try {
			let url = this.config.env[this.state.env].host + this.config.path.user.info
			const response = await fetch(url, {
				method: 'GET',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.accessToken)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			await storeValue(this.field.userInfo, json.data)
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async getOauthPage(provider, redirectURL, state = undefined) {
		let checkResult = this.checkPrerequisiteFunction({ needPageData: true, needApplicationData: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let path = this.config.path.application.authorize.replace("{id}", this.state.applicationInfo.appId)
			let url = this.config.env[this.state.env].host + path
			if (state != undefined){
				await storeValue(this.field.oauthState, state)
			}else{
				let reqId = crypto.randomUUID()
				state = this.state.applicationInfo.appId.concat("-",reqId)
				await storeValue(this.field.oauthState, state)
			}
			const response = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({
					provider: provider,
					redirectUrl: redirectURL, 
					state: state
				}),
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},
	async checkURL(){
		return {
			queryParam: appsmith.URL.queryParams,
			url: appsmith.URL
		}
	},
	async processOauthCallback( params = { checkState : true} ) {
		let checkResult = this.checkPrerequisiteFunction({ needPageData: true, needApplicationData: true })
		if (checkResult.error) {
			return checkResult
		}

		try {
			await this.checkURL()
			if (!appsmith.URL.queryParams.exchangeToken && !appsmith.URL.queryParams.error) {
				console.log('token', appsmith.URL.queryParams.exchangeToken)
				console.log('error', appsmith.URL.queryParams.error)
				return;
			}
			if (appsmith.URL.queryParams.error){
				return this.wrapResult(this.newError(appsmith.URL.queryParams.errorCode, appsmith.URL.queryParams.error), true)
			}
			let decodedExchangeToken = atob(appsmith.URL.queryParams.exchangeToken)
			
			let indexOfSeparator = decodedExchangeToken.indexOf(":")
			let state = decodedExchangeToken.substring(indexOfSeparator+1)
			if (params.checkState){
				if (appsmith.store.oauthState != state){
					return this.wrapResult(this.newError(this.errorConst.unauthorizedUser.code, this.errorConst.unauthorizedUser.message), true)
				}
			}

			let res = await this.exchangeToken(appsmith.URL.queryParams.exchangeToken)
			if (res.error) {
				return res
			}
			await this.setAuthorizedPage(res.data)
			let userToken = res.data
			userToken.state = state
			await this.getUserInfo()
			return this.wrapResult(userToken)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async refreshToken() {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = this.config.env[this.state.env].host + this.config.path.user.refreshToken
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.refreshToken)
			});

			let json = await response.json()
			let tokens = appsmith.store.tokens
			if (json.statusCode === 200) {
				tokens.accessToken = json.data.accessToken
				tokens.refreshToken = json.data.refreshToken
				await this.state.storeValue(this.field.token, tokens)
				return this.wrapResult(json.data)
			}
			return this.wrapResult(this.newError(json.errorCode, json.error), true)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async subjectLogout(token) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.logout
			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(true)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}

	},
	async subjectRefreshToken(token) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = this.config.env[this.state.env].host + this.config.path.subject.refreshToken
			let subjectTokenIndex = -1
			let tokens = appsmith.store.tokens
			for (let index = 0; index < tokens.subjectAccessToken.length; index++) {
				if (tokens.subjectAccessToken[index].refreshToken == token) {
					subjectTokenIndex = index
					break
				}
			}

			const response = await fetch(url, {
				method: 'POST',
				headers: this.composeHeaderAuthorization(token)
			});

			let json = await response.json()
			if (json.statusCode === 200) {
				if (subjectTokenIndex != -1) {
					tokens.subjectAccessToken[subjectTokenIndex].accessToken = json.data.accessToken
					tokens.subjectAccessToken[subjectTokenIndex].refreshToken = json.data.refreshToken
				} else {
					tokens.subjectAccessToken.push(json.data)
				}
				await this.state.storeValue(this.field.token, tokens)
				return this.wrapResult(json.data)
			}
			return this.wrapResult(this.newError(json.errorCode, json.error), true)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async subjectList(params = { name: '', code: '', sortBy: '', sortDirection: '', page: '', size: '' }) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = new URL(this.config.env[this.state.env].host + this.config.path.subject.list)
			const queryParams = new URLSearchParams({
				name: params.name,
				code: params.code,
				sortBy: params.sortBy,
				sortDirection: params.sortDirection,
				page: params.page,
				size: params.size,
			});
			url.search = queryParams
			const response = await fetch(url.toString(), {
				method: 'GET',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.accessToken)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async assignSubject(req = []) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = new URL(this.config.env[this.state.env].host + this.config.path.subject.assignSubject)
			const response = await fetch(url.toString(), {
				method: 'POST',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.accessToken),
				body: JSON.stringify(req)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},

	async unassignSubject(req = []) {
		let checkResult = this.checkPrerequisiteFunction({ needToken: true })
		if (checkResult.error) {
			return checkResult
		}
		try {
			let url = new URL(this.config.env[this.state.env].host + this.config.path.subject.unassignSubject)
			const response = await fetch(url.toString(), {
				method: 'DELETE',
				headers: this.composeHeaderAuthorization(appsmith.store.tokens.accessToken),
				body: JSON.stringify(req)
			});
			let json = await response.json()
			if (json.statusCode != 200) {
				return this.wrapResult(this.newError(json.errorCode, json.error), true)
			}
			return this.wrapResult(json.data)
		} catch (error) {
			return this.wrapResult(this.newError(this.errorConst.unexpectedError.code, error.message), true)
		}
	},
}