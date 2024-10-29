!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).rbac=t()}(this,(function(){"use strict";return{state:{hasSetState:!1,env:"dev",pages:void 0,useRefreshToken:!1,storeValue:async()=>{},navigateTo:async()=>{},clearStore:async()=>{},showAlert:async()=>{}},field:{token:"tokens",authorizedPage:"authorizedPages"},errorConst:{unexpectedError:{code:"unexpectedError",message:"Unexpected error"},unauthorizedUser:{code:"EVAC4007",message:"unauthorized user"},forbiddenAction:{code:"EVAC6007",message:"forbidden action"},requiredPageData:{code:"EVAC6008",message:"required page data"},requiredSetStateData:{code:"EVAC6009",message:"state data is required to be set"},tokenExpired:{code:"EVAC4008",message:"token has expired"}},config:{env:{dev:{host:"https://evm-rbac.staging.evermosa2z.com"}},path:{user:{login:"/v1/user/login",refreshToken:"/v1/user/refresh",logout:"/v1/user/logout",register:"/v1/user/register"},subject:{authorize:"/v1/subject/authorize",refreshToken:"/v1/subject/refresh",logout:"/v1/subject/logout",assignSubject:"/v1/subject/role",unassignSubject:"/v1/subject/role",list:"/v1/subject/list"}}},setState(e,t,r,s,o,i=!1){return this.state.hasSetState=!0,this.state.env=e,this.state.storeValue=t,this.state.navigateTo=r,this.state.clearStore=s,this.state.showAlert=o,this.state.useRefreshToken=i,this},setPages(e){return this.state.pages=e,this},setPages(e){return this.state.useRefreshToken=e,this},decodeToken:e=>jsonwebtoken.decode(e),checkPrerequisiteFunction(e={needPageData:!1}){return this.state.hasSetState?null==this.state.pages&&void 0!==e.needPageData&&e.needPageData?this.wrapResult(this.newError(this.errorConst.requiredPageData.code,this.errorConst.requiredPageData.message),!0):this.wrapResult(!0):this.wrapResult(this.newError(this.errorConst.requiredSetStateData.code,this.errorConst.requiredSetStateData.message),!0)},wrapResult:(e,t=!1)=>t?{code:e.errorCode,error:e.error}:{data:e},newError:(e,t)=>({errorCode:e,error:t}),composeHeaderAuthorization:e=>({"Content-Type":"application/json",Accept:"application/json",Authorization:"Bearer "+e}),getFirstAuthorizedPage(){for(const e in appsmith.store.authorizedPages){return appsmith.store.authorizedPages[e]}return this.wrapResult(this.newError(this.errorConst.forbiddenAction.code,this.errorConst.forbiddenAction.message),!0)},async setAuthorizedPage(e){let t={};if(null==e.subjectAccessToken)return await this.state.storeValue(this.field.authorizedPage,t),t;for(const r in e.subjectAccessToken){let s=e.subjectAccessToken[r];if(this.state.pages[s.object]){let e=this.state.pages[s.object],r=this.decodeToken(s.accessToken);e.id==r.objectId&&(t[e.code]=e)}}return await this.state.storeValue(this.field.authorizedPage,t),t},async login(e,t){let r=this.checkPrerequisiteFunction({needPageData:!0});if(r.error)return r;let s=this.config.env[this.state.env].host+this.config.path.user.login;return await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:e,password:t})}).then((async e=>{let t=await e.json();return 200===t.statusCode?(await this.state.storeValue(this.field.token,t.data),await this.setAuthorizedPage(t.data),this.wrapResult(t.data)):this.wrapResult(this.newError(t.errorCode,t.error),!0)})).catch((e=>this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)))},async register(e,t,r,s){let o=this.checkPrerequisiteFunction();if(o.error)return o;let i=this.config.env[this.state.env].host+this.config.path.user.register;return await fetch(i,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:e,password:t,appName:r,merchantCode:s})}).then((async e=>{let t=await e.json();return 201===t.statusCode?this.wrapResult(t.data):this.wrapResult(this.newError(t.errorCode,t.error),!0)})).catch((e=>this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)))},async authorizePage(e,t){let r=this.checkPrerequisiteFunction();if(r.error)return r;const s=appsmith.store.tokens.subjectAccessToken.filter((t=>t.object===e));if(0===s.length)return this.wrapResult(this.newError(this.errorConst.forbiddenAction.code,this.errorConst.forbiddenAction.message),!0);let o=s[0].accessToken,i=s[0].refreshToken;if(t!=this.decodeToken(o).objectId)return this.wrapResult(this.newError(this.errorConst.unauthorizedUser.code,this.errorConst.unauthorizedUser.message),!0);try{let e=this.config.env[this.state.env].host+this.config.path.subject.authorize;const t=await fetch(e,{method:"POST",headers:this.composeHeaderAuthorization(o)});let r=await t.json();if(200!=r.statusCode){if(console.log("errorAuthorized",r),this.state.useRefreshToken){console.log("useRefreshToken");let t=await this.subjectRefreshToken(i);if(t.error)return console.log("errorRefreshToken",t),this.wrapResult(this.newError(t.code,t.error),!0);console.log("successRefresh",t);const r=await fetch(e,{method:"POST",headers:this.composeHeaderAuthorization(t.accessToken)});let s=await r.json();return 200!=s.statusCode?this.wrapResult(this.newError(s.errorCode,s.error),!0):this.wrapResult(!0)}return this.wrapResult(this.newError(r.errorCode,r.error),!0)}return this.wrapResult(!0)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async logout(){let e=this.checkPrerequisiteFunction();if(e.error)return e;try{let e=this.config.env[this.state.env].host+this.config.path.user.logout;const t=await fetch(e,{method:"POST",headers:this.composeHeaderAuthorization(appsmith.store.tokens.accessToken)});let r=await t.json();return 200!=r.statusCode?this.wrapResult(this.newError(r.errorCode,r.error),!0):(await this.state.clearStore(this.field.token),this.wrapResult("success"))}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async refreshToken(){let e=this.checkPrerequisiteFunction();if(e.error)return e;try{let e=this.config.env[this.state.env].host+this.config.path.user.refreshToken;const t=await fetch(e,{method:"POST",headers:this.composeHeaderAuthorization(appsmith.store.tokens.refreshToken)});let r=await t.json();return 200===r.statusCode?(appsmith.store.tokens.accessToken=r.data.accessToken,appsmith.store.tokens.refreshToken=r.data.refreshToken,await this.state.storeValue(this.field.token,tokens),this.wrapResult(r.data)):this.wrapResult(this.newError(r.errorCode,r.error),!0)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async subjectLogout(e){let t=this.checkPrerequisiteFunction();if(t.error)return t;try{let t=this.config.env[this.state.env].host+this.config.path.subject.logout;const r=await fetch(t,{method:"POST",headers:this.composeHeaderAuthorization(e)});let s=await r.json();return 200!=s.statusCode?this.wrapResult(this.newError(s.errorCode,s.error),!0):this.wrapResult(!0)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async subjectRefreshToken(e){let t=this.checkPrerequisiteFunction();if(t.error)return t;try{let t=this.config.env[this.state.env].host+this.config.path.subject.refreshToken,r=-1;for(let t=0;t<appsmith.store.tokens.subjectAccessToken;t++)if(appsmith.store.tokens.subjectAccessToken[t].refreshToken==e){r=t;break}let s=appsmith.store.tokens;const o=await fetch(t,{method:"POST",headers:this.composeHeaderAuthorization(e)});let i=await o.json();return 200===i.statusCode?(-1!=r?(s.subjectAccessToken[r].accessToken=i.data.accessToken,s.subjectAccessToken[r].refreshToken=i.data.refreshToken):s.subjectAccessToken.push(i.data),await this.state.clearStore(this.field.token),await this.state.storeValue(this.field.token,s),this.wrapResult(i.data)):this.wrapResult(this.newError(i.errorCode,i.error),!0)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async subjectList(e={name:void 0,code:void 0,sortBy:void 0,sortDirection:void 0,page:void 0,size:void 0}){let t=this.checkPrerequisiteFunction();if(t.error)return t;try{let t=new URL(this.config.env[this.state.env].host+this.config.path.subject.list);const r=new URLSearchParams({name:e.name,code:e.code,sortBy:e.sortBy,sortDirection:e.sortDirection,page:e.page,size:e.size});t.search=r;const s=await fetch(t.toString(),{method:"GET",headers:this.composeHeaderAuthorization(appsmith.store.tokens.accessToken)});let o=await s.json();return 200!=o.statusCode?this.wrapResult(this.newError(o.errorCode,o.error),!0):this.wrapResult(o.data)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async assignSubject(e=[]){let t=this.checkPrerequisiteFunction();if(t.error)return t;try{let t=new URL(this.config.env[this.state.env].host+this.config.path.subject.assignSubject);const r=await fetch(t.toString(),{method:"POST",headers:this.composeHeaderAuthorization(appsmith.store.tokens.accessToken),body:JSON.stringify(e)});let s=await r.json();return 200!=s.statusCode?this.wrapResult(this.newError(s.errorCode,s.error),!0):this.wrapResult(s.data)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}},async unassignSubject(e=[]){let t=this.checkPrerequisiteFunction();if(t.error)return t;try{let t=new URL(this.config.env[this.state.env].host+this.config.path.subject.unassignSubject);const r=await fetch(t.toString(),{method:"DELETE",headers:this.composeHeaderAuthorization(appsmith.store.tokens.accessToken),body:JSON.stringify(e)});let s=await r.json();return 200!=s.statusCode?this.wrapResult(this.newError(s.errorCode,s.error),!0):this.wrapResult(s.data)}catch(e){return this.wrapResult(this.newError(this.errorConst.unexpectedError,e.message),!0)}}}}));
