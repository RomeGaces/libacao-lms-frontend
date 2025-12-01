<script setup lang="ts">
import { AccessEnum } from '~@/utils/constant'

const { hasAccess, roles } = useAccess()
</script>

<template>
  <div class="flex flex-col gap-2">
    <div>
      List of permissions the current user has <a class="c-primary"> {{ roles?.join(',') }}</a>
    </div>

    Visible to all users
    Fine-grained control down to the button level

    <a-alert message="Using Access components" />
    <a-space>
      <Access :access="[AccessEnum.USER, AccessEnum.ADMIN]">
        <a-button>Ordinary user</a-button>
      </Access>
      <Access :access="AccessEnum.ADMIN">
        <a-button type="primary">
          administrator
        </a-button>
      </Access>
    </a-space>
    <a-alert message="Use the useAccess combined API" />
    <a-space>
      <a-button v-if="hasAccess([AccessEnum.USER, AccessEnum.ADMIN])">
        Ordinary user
      </a-button>
      <a-button v-if="hasAccess(AccessEnum.ADMIN)" type="primary">
        administrator
      </a-button>
    </a-space>
    <a-alert message="Using the v-access directive" />
    <a-space>
      <a-button v-access="[AccessEnum.USER, AccessEnum.ADMIN]">
        Ordinary user
      </a-button>
      <a-button v-access="AccessEnum.ADMIN" type="primary">
        administrator
      </a-button>
    </a-space>
  </div>
</template>
