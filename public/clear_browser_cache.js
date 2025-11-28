// Clear localStorage corrections and confirmations
localStorage.removeItem('job_corrections');
localStorage.removeItem('confirmed_jobs');
localStorage.removeItem('user_corrections');
localStorage.removeItem('classification_corrections');
localStorage.removeItem('learning_data');

// Clear sessionStorage too
sessionStorage.clear();

console.log('✅ Browser storage cleared - refresh page for clean start');