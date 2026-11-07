// Keep the publication gate and local test command on the same suite.
for(const file of ['navigation.test.mjs','lightbox.test.mjs','language-preference.test.mjs','resources.test.mjs','spa-treatments.test.mjs']){
  await import(new URL(file,import.meta.url));
}
