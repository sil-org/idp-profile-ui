import { reactive } from 'vue'
import api from '@/plugins/api'

export const recoveryMethods = reactive({
  system: [],
  alternates: [],
})

export const add = async (email) => {
  const newMethod = await api.post('method', {
    value: email,
  })

  recoveryMethods.alternates.push(newMethod)
}

export const retrieve = async () => {
  clear()

  const all = await api.get('method')

  recoveryMethods.system.push(...all.filter((m) => m.type != 'email'))
  recoveryMethods.alternates.push(...all.filter((m) => m.type == 'email'))
}

function clear() {
  recoveryMethods.system.splice(0)
  recoveryMethods.alternates.splice(0)
}

export const remove = async (id) => {
  await api.delete(`method/${id}`)

  const i = recoveryMethods.alternates.findIndex((m) => m.id === id)
  if (i > -1) {
    recoveryMethods.alternates.splice(i, 1)
  }
}

export const verify = async (id, verificationCode = '') => {
  await api.put(`method/${id}/verify`, {
    code: verificationCode,
  })
}

export default recoveryMethods
