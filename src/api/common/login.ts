export interface LoginParams {
  email: string
  password: string
  type?: 'account'
}

export interface LoginResultModel {
  user: {
    id: number
    name: string
    email: string
    professor_id: number
    is_admin: boolean
    created_at: string
    updated_at: string
  }
  access_token: string
  token_type: string

}

export function loginApi(params: LoginParams) {
  return usePost<LoginResultModel, LoginParams>('/login', params, {
    // When set to false, no token will be carried
    token: true,
    // Using custom interfaces in development mode
    customDev: true,
    // Whether to enable global request loading
    loading: true,
  })
}

export function logoutApi() {
  return useGet('/logout')
}
