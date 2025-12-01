<script setup lang="ts">
import type { LoginParams } from '~@/api/common/login'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import { delayTimer } from '@v-c/utils'
import { AxiosError } from 'axios'
import pageBubble from '@/utils/page-bubble'
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
const submitLoading = shallowRef(false)
const errorAlert = shallowRef(false)
const bubbleCanvas = ref<HTMLCanvasElement>()

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
onMounted(async () => {
  await delayTimer(300)
  pageBubble.init(unref(bubbleCanvas)!)
})

onBeforeUnmount(() => {
  pageBubble.removeListeners()
})
</script>

<template>
  <div class="login-container">
    <div h-screen w-screen absolute z-10>
      <canvas ref="bubbleCanvas" />
    </div>
    <div class="login-content flex-center">
      <div class="ant-pro-form-login-main rounded">
        <!-- Login header -->
        <div class="flex-between h-15 px-4 mb-[2px]">
          <div class="flex-end">
            <span class="ant-pro-form-login-logo">
              <img w-full h-full object-cover src="/logo.png">
            </span>
            <span class="ant-pro-form-login-title">
              Libacao LMS
            </span>
            <span class="ant-pro-form-login-desc">
              {{ 'Libacao Learners Management System' }}
            </span>
          </div>
          <div class="login-lang flex-center relative z-11">
            <span
              class="flex-center cursor-pointer text-16px"
              @click="appStore.toggleTheme(layoutSetting.theme === 'dark' ? 'light' : 'dark')"
            >
              <!-- Light and dark mode switch button -->
              <template v-if="layoutSetting.theme === 'light'">
                <carbon-moon />
              </template>
              <template v-else>
                <carbon-sun />
              </template>
            </span>
          </div>
        </div>
        <a-divider m-0 />
        <!-- 登录主体 -->
        <div class="box-border flex min-h-[520px]">
          <!-- 登录框左侧 -->
          <div class="ant-pro-form-login-main-left min-h-[520px] flex-center  bg-[var(--bg-color-container)]">
            <img src="@/assets/images/login-left.png" class="h-5/6 w-5/6">
          </div>
          <a-divider m-0 type="vertical" class="ant-pro-login-divider  min-h-[520px]" />
          <!-- 登录框右侧 -->
          <div class="ant-pro-form-login-main-right px-5 w-[335px] flex-center flex-col relative z-11">
            <div class="text-center py-6 text-2xl">
              {{ 'Welcome to Libacao LMS' }}
            </div>
            <a-form ref="formRef" :model="loginModel">
              <!-- 判断是否存在error -->
              <a-alert
                v-if="errorAlert && loginModel.type === 'account'" mb-24px
                message="Incorrect Email or Password" type="error" show-icon
              />
              <a-form-item name="email" :rules="[{ required: true, message: 'Please enter your email' }]">
                <a-input
                  v-model:value="loginModel.email" allow-clear autocomplete="off"
                  placeholder="Email: user@libacao-university.edu" size="large" @press-enter="submit"
                >
                  <template #prefix>
                    <UserOutlined />
                  </template>
                </a-input>
              </a-form-item>
              <a-form-item name="password" :rules="[{ required: true, message: 'Password is required' }]">
                <a-input-password
                  v-model:value="loginModel.password" allow-clear
                  placeholder="Password" size="large" @press-enter="submit"
                >
                  <template #prefix>
                    <LockOutlined />
                  </template>
                </a-input-password>
              </a-form-item>
              <div class="mb-24px flex-between">
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
    </div>
    <div py-24px px-50px fixed bottom-0 z-11 w-screen :data-theme="layoutSetting.theme" text-14px>
      <GlobalLayoutFooter>
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
  height: 40px;
  line-height: 44px;
}

.login-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.ant-pro-form-login-header a {
  text-decoration: none;
}

.ant-pro-form-login-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: 33px;
  line-height: 1;
}

.ant-pro-form-login-logo {
  width: 44px;
  height: 44px;
  margin-right: 16px;
  vertical-align: top;
}

.ant-pro-form-login-desc {
  color: var(--text-color-1);
  font-size: 14px;
  margin-left: 16px;
}

.ant-pro-form-login-main-right {
  .ant-tabs-nav-list {
    margin: 0 auto;
    font-size: 16px;
  }

  .ant-pro-form-login-other {
    line-height: 22px;
    text-align: center;
  }
}

.ant-pro-form-login-main {
  box-shadow: var(--c-shadow);
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

.login-media(@width: 100%) {
  .ant-pro-form-login-main {
    width: @width;
  }

  .ant-pro-form-login-main-left {
    display: none;
  }

  .ant-pro-form-login-main-right {
    width: 100%;
  }

  .ant-pro-form-login-desc {
    display: none;
  }
}

@media (min-width: 992px) {
  .ant-pro-form-login-main-left {
    width: 700px;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .ant-pro-login-divider {
    display: none;
  }

  .login-media(400px);
}

@media screen and (max-width: 767px) {
  .login-media(350px);

  .ant-pro-login-divider {
    display: none;
  }
}
</style>
