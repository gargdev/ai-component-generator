import { auth as nextAuth } from '../auth'

export async function auth() {
  return await nextAuth()
}