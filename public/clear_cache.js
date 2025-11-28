// CLEAR BROWSER CACHE SCRIPT
// Run this in the browser console to clear all cached data

console.log('🧹 Clearing all browser cache and local storage...');

// Clear local storage
if (typeof(Storage) !== "undefined") {
  localStorage.clear();
  console.log('✅ Local storage cleared');
}

// Clear session storage
if (typeof(Storage) !== "undefined") {
  sessionStorage.clear();
  console.log('✅ Session storage cleared');
}

// Clear any IndexedDB data
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
    console.log('✅ IndexedDB cleared');
  });
}

// Force reload without cache
console.log('🔄 Forcing hard refresh...');
window.location.reload(true);

// Alternative: Use newer cache API if available
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
    console.log('✅ Service Worker caches cleared');
  });
}

console.log('✅ Cache clearing complete! Page will reload...');








