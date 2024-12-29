import axios, { AxiosError, AxiosInstance, HttpStatusCode } from 'axios'
import configBase from '../constants/config'
import { clearLocalStorage, getAccessTokenFromLS, saveAccessTokenToLS, setProfileFromLS } from './auth'
import { toast } from 'react-toastify'
import path from '../constants/path'
class Http {
  instance: AxiosInstance
  private accessToken: string
  constructor() {
    this.accessToken = `Bearer ${getAccessTokenFromLS()}`
    this.instance = axios.create({
      baseURL: configBase.baseURL,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
    this.instance.interceptors.request.use(
      (config) => {
        if (this.accessToken && config.headers) {
          config.headers.authorization = this.accessToken
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === path.register || url === path.login) {
          const data = response.data
          this.accessToken = data.data?.access_token

          saveAccessTokenToLS(this.accessToken)
          setProfileFromLS(data.data.user)
        } else if (url === '/logout') {
          this.accessToken = ''
          clearLocalStorage()
        }
        return response
      },
      function (error: AxiosError) {
        if (error.response?.status !== HttpStatusCode.UnprocessableEntity) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any | undefined = error.response?.data
          const message = data.message || error.message
          toast.error(message)
        }
        if (error.response?.status === HttpStatusCode.Unauthorized) {
          // clearLocalStorage()
        }
        return Promise.reject(error)
      }
    )
  }
}
const http = new Http().instance
export default http
