<script setup lang="ts">
import type { LoginParams } from '~@/api/common/login'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { AxiosError } from 'axios'
import { loginApi } from '~/api/common/login'
import GlobalLayoutFooter from '~/layouts/components/global-footer/index.vue'
import { getQueryParam } from '~/utils/tools'

const notification = useNotification()
const appStore = useAppStore()
const { layoutSetting } = storeToRefs(appStore)
const router = useRouter()
const token = useAuthorization()
const loginModel = reactive({
  email: undefined,
  password: undefined,
  type: 'account',
  remember: true,
})
const formRef = shallowRef()
const resetCounter = 60
const submitLoading = shallowRef(false)
const errorAlert = shallowRef(false)

const { pause } = useInterval(1000, {
  controls: true,
  immediate: false,
  callback(count) {
    if (count) {
      if (count === resetCounter)
        pause()
    }
  },
})

async function submit() {
  submitLoading.value = true
  try {
    await formRef.value?.validate()

    const params = {
      email: loginModel.email,
      password: loginModel.password,
    } as unknown as LoginParams

    const { data } = await loginApi(params)
    token.value = data?.access_token
    notification.success({
      message: 'Login successful',
      description: 'Welcome back!',
      duration: 3,
    })
    // Get whether there is a redirect link at present, if so, go to the redirect address
    const redirect = getQueryParam('redirect', '/')
    router.push({
      path: redirect,
      replace: true,
    })
  }
  catch (e) {
    if (e instanceof AxiosError)
      errorAlert.value = true

    submitLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-lang" flex="~" items-center justify-end gap-2 px-24px>
      <span flex items-center justify-center cursor-pointer text-16px @click="appStore.toggleTheme(layoutSetting.theme === 'dark' ? 'light' : 'dark')">
        <!-- Light and dark mode switch button -->
        <template v-if="layoutSetting.theme === 'light'">
          <carbon-moon />
        </template>
        <template v-else>
          <carbon-sun />
        </template>
        <SelectLang />
      </span>
    </div>
    <div class="login-content">
      <div class="ant-pro-form-login-container">
        <div class="ant-pro-form-login-top">
          <div class="ant-pro-form-login-header">
            <span class="ant-pro-form-login-logo">
              <img src="/logo.svg">
            </span>
            <span class="ant-pro-form-login-title">
              Libacao LMS
            </span>
          </div>
          <div class="ant-pro-form-login-desc">
            {{ 'Libacao Learners Management System' }}
          </div>
        </div>
        <div class="ant-pro-form-login-main" w-335px>
          <a-form ref="formRef" :model="loginModel">
            <!-- Determine whether there is an error -->
            <a-alert v-if="errorAlert && loginModel.type === 'account'" mb-24px message="Incorrect Email or Password" type="error" show-icon />
            <a-form-item name="email" :rules="[{ required: true, message: 'Please enter your email' }]">
              <a-input v-model:value="loginModel.email" allow-clear placeholder="Email: user@libacao-university.edu" size="large" @press-enter="submit">
                <template #prefix>
                  <UserOutlined />
                </template>
              </a-input>
            </a-form-item>
            <a-form-item name="password" :rules="[{ required: true, message: 'Password is required' }]">
              <a-input-password v-model:value="loginModel.password" allow-clear placeholder="Password" size="large" @press-enter="submit">
                <template #prefix>
                  <LockOutlined />
                </template>
              </a-input-password>
            </a-form-item>
            <div class="mb-24px" flex items-center justify-between>
              <a-checkbox v-model:checked="loginModel.remember">
                {{ "Remember Me!" }}
              </a-checkbox>
              <a>{{ "Forgot Password? " }}</a>
            </div>
            <a-button type="primary" block :loading="submitLoading" size="large" @click="submit">
              {{ "Login" }}
            </a-button>
          </a-form>
        </div>
      </div>
    </div>
    <div py-24px px-50px :data-theme="layoutSetting.theme" text-14px>
      <GlobalLayoutFooter :copyright="layoutSetting.copyright">
        <template #renderFooterLinks>
          <footer-links />
        </template>
      </GlobalLayoutFooter>
    </div>
  </div>
</template>

<style lang="less" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: auto;
  background: var(--bg-color-container);
}

.login-lang {
  width: 100%;
  height: 40px;
  line-height: 44px;
}

.login-content {
  flex: 1 1;
  padding: 32px 0;
}
.ant-pro-form-login-container {
  display: flex;
  flex: 1 1;
  flex-direction: column;
  height: 100%;
  padding: 32px 0;
  overflow: auto;
  background: inherit;
}

.ant-pro-form-login-top {
  text-align: center;
}

.ant-pro-form-login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  line-height: 44px;
}

.ant-pro-form-login-header a {
  text-decoration: none;
}

.ant-pro-form-login-title {
  position: relative;
  top: 2px;
  color: var(--text-color);
  font-weight: 600;
  font-size: 33px;
}

.ant-pro-form-login-logo {
  width: 44px;
  height: 44px;
  margin-right: 16px;
  vertical-align: top;
}

.ant-pro-form-login-logo img {
  width: 100%;
}

.ant-pro-form-login-desc {
  margin-top: 12px;
  margin-bottom: 40px;
  color: var(--text-color-1);
  font-size: 14px;
}

.ant-pro-form-login-main {
  min-width: 328px;
  max-width: 500px;
  margin: 0 auto;

  .ant-tabs-nav-list {
    margin: 0 auto;
    font-size: 16px;
  }
  .ant-pro-form-login-other {
    margin-top: 24px;
    line-height: 22px;
    text-align: left;
  }

  .icon {
    margin-left: 8px;
    color: var(--text-color-2);
    font-size: 24px;
    vertical-align: middle;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: var(--pro-ant-color-primary);
    }
  }
}

@media (min-width: 768px) {
  .login-container {
    background-image: url(https://gw.alipayobjects.com/zos/rmsportal/TVYTbAXWheQpRcWDaDMu.svg);
    background-repeat: no-repeat;
    background-position: center 110px;
    background-size: 100%;
  }

  .login-content {
    padding: 32px 0 24px;
  }

  .ant-pro-form-login-container {
    padding: 32px 0 24px;
    background-repeat: no-repeat;
    background-position: center 110px;
    background-size: 100%;
  }
}
</style>
