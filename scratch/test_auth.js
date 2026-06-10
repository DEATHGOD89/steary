const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kmohuqqpfrufkrbtuirt.supabase.co', 'sb_publishable_vSabtm7DCF5PZzcHwO1Mng_fvVCQKwx');

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'bhupendersingh123456789011@gmail.com',
    password: 'zxabbhu#@$123890ASDnm$#@'
  });
  
  if (error) {
    console.log('Login Error Details:');
    console.log('Message:', error.message);
    console.log('Status:', error.status);
    console.log('Name:', error.name);
  } else {
    console.log('Login Successful!');
    console.log('User ID:', data.user.id);
  }
}

testAuth();