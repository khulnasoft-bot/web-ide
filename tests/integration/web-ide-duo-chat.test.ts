import { expect, test } from '@playwright/test';
import { WebIDE } from './WebIDE';
import { getFixture } from './utils';
import type { Workbench } from './pages/workbench/Workbench';
import type { InitForm } from './pages/init-form/InitForm';
import type { MockGraphQLRequest } from './network/MockGraphQLRequest';

const SIMPLE_GREETING_RESPONSE =
  "Hello! I'm GitLab Duo, your AI coding assistant. How can I help you today?";
const JAVASCRIPT_EXAMPLE_RESPONSE =
  "Here's a simple JavaScript function to calculate the factorial of a number:";

let webIde: WebIDE;
let workbench: Workbench;
let initForm: InitForm;
let mockGraphQLRequest: MockGraphQLRequest;

test.beforeEach(async ({ page }) => {
  const { fileContent: aiMessagesResponses } = await getFixture(
    'duo/aiMessagesResponses.json',
    'json',
  );

  webIde = new WebIDE(page);
  workbench = webIde.workbench;
  initForm = webIde.initForm;
  mockGraphQLRequest = webIde.mockGraphQLRequest;

  await mockGraphQLRequest.initialize();

  // Mock the getAiMessages API response
  mockGraphQLRequest.mockGetAiMessagesRequest('ASSISTANT', aiMessagesResponses.simpleGreeting);

  mockGraphQLRequest.mockGetAiMessagesRequest('USER', aiMessagesResponses.hiUserMessage);

  // Opens the Web IDE example app.
  await webIde.goto();

  // Fills in the GitLab URL, project path, repository ref, and token in the example app initialization form
  // and starts the Web IDE.
  await initForm.initWebIDE();

  // Asserts that the Web IDE is loaded and initialized with the project
  await workbench.waitForReady();

  // Opens Duo Chat panel before each test so the input is visible
  await workbench.duoChatPanel.openDuoChatPanel();

  // Asserts that the Duo Chat prompt input is visible
  await expect(workbench.duoChatPanel.getChatPromptInput()).toBeVisible({ timeout: 15000 });
});

test('sends a prompt and receives a response', async () => {
  const userPrompt = 'Hi Duo!';

  // send chat prompt
  await workbench.duoChatPanel.sendChatPrompt(userPrompt);

  // Assert that the chat response shows
  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeVisible({ timeout: 10000 });
});

test('maintains conversation history', async () => {
  const { fileContent: aiMessagesResponses } = await getFixture(
    'duo/aiMessagesResponses.json',
    'json',
  );
  const firstPrompt = 'Hi Duo!';
  const secondPrompt = 'Give me a javascript function';

  // Mock different response
  mockGraphQLRequest.mockGetAiMessagesRequest('ASSISTANT', aiMessagesResponses.javascriptExample);

  // Send first message
  await workbench.duoChatPanel.sendChatPrompt(firstPrompt);
  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeVisible({ timeout: 10000 });

  // Send follow-up message
  await workbench.duoChatPanel.sendChatPrompt(secondPrompt);

  // Assert that both messages and responses are visible in chat history
  const chatHistory = workbench.duoChatPanel.getChatHistory();
  await expect(chatHistory.getByText(firstPrompt)).toBeVisible({ timeout: 10000 });
  await expect(chatHistory.getByText(secondPrompt)).toBeVisible();
  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeVisible();
  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(JAVASCRIPT_EXAMPLE_RESPONSE),
  ).toBeVisible();
});

test('clears chat', async () => {
  const userPrompt = 'Hi Duo!';

  await workbench.duoChatPanel.sendChatPrompt(userPrompt);

  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeVisible({ timeout: 10000 });

  await workbench.duoChatPanel.clearChat();

  // Assert that chat history is cleared
  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeHidden({ timeout: 10000 });
});

test('resets chat', async () => {
  const userPrompt = 'Hi Duo!';

  await workbench.duoChatPanel.sendChatPrompt(userPrompt);

  await expect(
    workbench.duoChatPanel.getChatHistory().getByText(SIMPLE_GREETING_RESPONSE),
  ).toBeVisible({ timeout: 10000 });

  await workbench.duoChatPanel.resetChat();

  // Assert that new chat has started
  await expect(workbench.duoChatPanel.duoChatFrame.getByText('New chat')).toBeVisible({
    timeout: 10000,
  });
});
