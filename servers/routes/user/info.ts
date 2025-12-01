import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const token = event.req.headers.get('Authorization')
  // eslint-disable-next-line node/prefer-global/buffer
  const username = Buffer.from(token, 'base64').toString('utf-8')
  if (!token) {
    return {
      code: 401,
      msg: 'Login invalid',
    }
  }
  return {
    code: 200,
    msg: 'get success',
    data: {
      id: 1,
      username,
      nickname: username === 'admin' ? 'Rome' : 'Mark',
      avatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
      roles: username === 'admin' ? ['ADMIN'] : ['USER'],
    },
  }
})
