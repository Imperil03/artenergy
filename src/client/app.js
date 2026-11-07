// Shared behavior is initialized once; each feature owns its listeners and state.
document.documentElement.classList.add('js');
const {motion,dialogMotion}=createMotion();
initNavigation();
initGallery(motion);
initOverview(motion,dialogMotion);
initStickyContact();
initLightbox(motion,dialogMotion);
initMenu(motion);
initContactActions();
initServiceLanguageLinks();
