<script setup>
useSeoMeta({ title: "MEL group — Home" });
</script>

<template>
  <section id="home"><Hero /></section>

  <UContainer>
    <section id="research"><Research /></section>

    <section id="team"><Team :limit="8" /></section>

    <section id="news"><NewsHome /></section>

  </UContainer>
</template>
