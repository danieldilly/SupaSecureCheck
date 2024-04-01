// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    ['nuxt-quasar-ui', { sassVariables: '~/assets/css/quasar.variables.scss' }]
  ]
})
