import { connectJaggiSupabase } from './supabase-client.js';

const screen = document.getElementById('login-screen');
const app = document.querySelector('.app-shell');
const form = document.getElementById('login-form');
const message = document.getElementById('login-message');
const submit = form.querySelector('button[type="submit"]');
const logout = document.getElementById('logout-button');
const switchButton = document.getElementById('auth-switch');
const switchPrompt = document.getElementById('auth-switch-prompt');
const confirmLabel = document.getElementById('signup-confirm-label');
const confirmInput = document.getElementById('signup-confirm');
const passwordInput = document.getElementById('login-password');
let client;
let signupMode = false;

function notice(text, success = false) {
  message.textContent = text;
  message.classList.toggle('success', success);
}
function setMode(signup) {
  signupMode = signup;
  confirmLabel.hidden = !signup;
  confirmInput.hidden = !signup;
  confirmInput.required = signup;
  confirmInput.value = '';
  passwordInput.autocomplete = signup ? 'new-password' : 'current-password';
  submit.textContent = signup ? 'Create account' : 'Sign in';
  switchPrompt.textContent = signup ? 'Already have an account?' : "Don't have an account?";
  switchButton.textContent = signup ? 'Sign in' : 'Sign up';
  notice('');
}
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
  setMode(false);
}

switchButton.addEventListener('click', () => setMode(!signupMode));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) {
    notice('Connection unavailable. Open this site on localhost or HTTPS.');
    return;
  }
  const email = form.elements.email.value.trim();
  const password = passwordInput.value;
  if (signupMode) {
    if (password.length < 8) {
      notice('Use a password of at least 8 characters.');
      return;
    }
    if (password !== confirmInput.value) {
      notice('Passwords do not match.');
      return;
    }
  }
  const creatingAccount = signupMode;
  submit.disabled = true;
  submit.textContent = creatingAccount ? 'Creating account…' : 'Signing in…';
  notice('');
  try {
    if (creatingAccount) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      if (data.session?.user) {
        showApp(data.session.user);
      } else {
        showLogin();
        notice('Please check your email to confirm your account, then sign in.', true);
      }
    } else {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user || !data.session) throw new Error('Sign in did not return a session.');
      showApp(data.user);
    }
  } catch (error) {
    notice(error.message || 'Something went wrong. Please try again.');
  } finally {
    submit.disabled = false;
    submit.textContent = signupMode ? 'Create account' : 'Sign in';
  }
});
logout.addEventListener('click', async () => {
  if (!client) return;
  logout.disabled = true;
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    showLogin();
    notice('You have signed out.', true);
  } catch (error) {
    notice(error.message || 'Sign out failed.');
  } finally {
    logout.disabled = false;
  }
});

try {
  client = await connectJaggiSupabase();
  window.jaggiSupabase = client;
  const { data: { session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (session?.user) showApp(session.user);
  else showLogin();
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.user) showApp(session.user);
    else if (screen.hidden) showLogin();
  });
} catch (error) {
  showLogin();
  notice('Could not connect to Supabase. Please use localhost or HTTPS and check your internet.');
  console.error('Jaggi Properties authentication initialization failed:', error);
}
