import service from '../service'

export function login(data) {
  return service({
    url: '/user/login',
    method: 'post',
    data
  })
}
