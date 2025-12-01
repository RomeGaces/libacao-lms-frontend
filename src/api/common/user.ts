export interface UserInfo {
  id: number | string
  username: string
  nickname: string
  avatar: string
  roles?: (string | number)[]
}

export function getUserInfoApi() {
  // return useGet<UserInfo>('/user/info')
  return {
    code: 200,
    msg: 'get success',
    data: {
      id: 1,
      username: 'Mark',
      nickname: 'Mark',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
      roles: ['ADMIN'],
    },
  }
}
