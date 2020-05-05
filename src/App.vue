<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawerModel"
      :clipped="true"
      :mini-variant="true"
      app
      overflow>
      <v-list nav>
        <v-list-item v-for="link in links" :key="link.title" :to="link.url">
          <v-list-item-icon><v-icon>{{ link.icon }}</v-icon></v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ link.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="primary"
      dark
      dense
      :clipped-left="true">
      <v-app-bar-nav-icon @click.stop="drawerModel = !drawerModel" class="d-lg-none"/>
      <v-toolbar-title>COVID19 Dashboard</v-toolbar-title>
    </v-app-bar>

    <v-content>
      <v-container fluid>
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: 'App',

  components: {
  },

  data: () => ({
    drawerModel: true,
    links: [
      { title: 'Home', icon: 'home', url: '/' },
      { title: 'Map', icon: 'map', url: '/map' },
      { title: 'About', icon: 'info', url: '/about' }
    ]
  })
}
</script>
