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

const switchButton = document.createElement('button');
switchButton.type = 'button';
switchButton.id = 'auth-switch';
switchButton.textContent = 'Create an account';
const switchPrompt = document.createElement('span');
switchPrompt.textContent = 'New here? ';
const switchRow = document.createElement('p');
switchRow.className = 'login-help';
switchRow.append(switchPrompt, switchButton);
form.after(switchRow);
const confirmLabel = document.createElement('label');
confirmLabel.htmlFor = 'signup-confirm';
confirmLabel.textContent = 'Confirm password';
const confirmInput = document.createElement('input');
confirmInput.id = 'signup-confirm';
confirmInput.type = 'password';
confirmInput.autocomplete = 'new-password';
confirmInput.placeholder = 'Re-enter password';
const passwordInput = form.querySelector('[name="password"]');
passwordInput.after(confirmLabel, confirmInput);
let signupMode = false;
function setSignupMode(enabled) {
  signupMode = enabled;
  confirmLabel.hidden = !enabled;
  confirmInput.hidden = !enabled;
  confirmInput.required = enabled;
  submit.textContent = enabled ? 'Create account' : 'Sign in';
  switchPrompt.textContent = enabled ? 'Already have an account? ' : 'New here? ';
  switchButton.textContent = enabled ? 'Sign in' : 'Create an account';
  notice('');
}
setSignupMode(false);
switchButton.addEventListener('click', () => setSignupMode(!signupMode));
form.addEventListener('submit', async event => {
  if (!signupMode) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!client) return;
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  if (password.length < 8) { notice('Use a password with at least 8 characters.'); return; }
  if (password !== confirmInput.value) { notice('Passwords do not match.'); return; }
  submit.disabled = true;
  submit.textContent = 'Creating account…';
  try {
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) throw error;
    if (data.session?.user) showApp(data.session.user);
    else {
      setSignupMode(false);
      notice('Account created. Check your email for a confirmation link, then sign in.');
    }
  } catch (error) { notice(error.message || 'Could not create account.'); }
  finally {
    submit.disabled = false;
    submit.textContent = signupMode ? 'Create account' : 'Sign in';
  }
}, true);
