import { connectJaggiSupabase } from './supabase-client.js';

const screen = document.getElementById('login-screen');
const app = document.querySelector('.app-shell');
const form = document.getElementById('login-form');
const message = document.getElementById('login-message');
const submit = form.querySelector('button[type="submit"]');
const logout = document.getElementById('logout-button');
let client;

function notice(text) { message.textContent = text; }
function showApp(user) {
  app.hidden = false;
  screen.hidden = true;
  logout.hidden = false;
  const emailLabel = document.getElementById('account-email');
  if (emailLabel) emailLabel.textContent = user.email || 'Administrator';
}
function showLogin() {
  app.hidden = true;
  screen.hidden = false;
  logout.hidden = true;
  form.reset();
}
try {
  client = await connectJaggiSupabase();
  window.jaggiSupabase = client;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (session?.user) showApp(session.user);
  else showLogin();
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showApp(session.user);
    else showLogin();
  });
} catch (error) {
  showLogin();
  notice('Could not connect to Supabase. Open this website through a local web server or HTTPS, and check your internet connection.');
  submit.disabled = true;
  console.error('Jaggi Properties authentication initialization failed:', error);
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return;
  notice('');
  submit.disabled = true;
  submit.textContent = 'Signing in…';
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Login failed. Please try again.');
    showApp(data.user);
  } catch (error) {
    notice(error.message || 'Could not sign in.');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Sign in';
  }
});
logout.addEventListener('click', async () => {
  if (!client) return;
  logout.disabled = true;
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    showLogin();
    notice('You have signed out.');
  } catch (error) {
    alert('Sign out failed: ' + error.message);
  } finally {
    logout.disabled = false;
  }
});
