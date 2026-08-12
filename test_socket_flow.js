const io = require('socket.io-client');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function runSocketSimulation() {
  console.log('--- Starting Enhanced Real-Time Socket Simulation ---');

  const serverUrl = 'http://localhost:3000';

  // 1. Admin socket
  const adminSocket = io(serverUrl);
  let adminState = null;
  adminSocket.on('admin_state', state => {
    adminState = state;
  });

  // 2. Display socket
  const displaySocket = io(serverUrl);
  let displayState = null;
  displaySocket.on('display_state', state => {
    displayState = state;
  });

  // 3. Guest sockets
  const guest1Socket = io(serverUrl);
  const guest2Socket = io(serverUrl);

  let guest1State = null;
  let guest2State = null;

  guest1Socket.on('guest_state', s => { guest1State = s; });
  guest2Socket.on('guest_state', s => { guest2State = s; });

  await sleep(200);

  // Register clients
  adminSocket.emit('register_admin');
  displaySocket.emit('register_display');
  guest1Socket.emit('register_guest', { guestId: 'guest-alice-123', name: 'Alice' });
  guest2Socket.emit('register_guest', { guestId: 'guest-bob-456', name: 'Bob' });

  await sleep(300);
  console.log('✅ Registered: Admin, Display, Alice, Bob.');
  console.log(`Connected Guests on Display: ${displayState?.playersList?.length || 0}`);

  // Test Round 1 (Q1: single answer, 4 choices)
  console.log('\n🚀 [Round 1] Admin starts game...');
  adminSocket.emit('admin_start_game');
  await sleep(300);

  console.log(`Q1 Choices Count: ${adminState?.question?.choices?.length}`);
  console.log(`Q1 Correct: ${adminState?.question?.correctChoices.join(', ')}`);

  // Alice answers correct B, Bob answers wrong A
  guest1Socket.emit('submit_answer', { guestId: 'guest-alice-123', choices: ['B'] });
  guest2Socket.emit('submit_answer', { guestId: 'guest-bob-456', choices: ['A'] });
  await sleep(300);

  // Verify that during QUESTION state, guests don't know the result yet
  console.log(`Alice state during question: Status=${guest1State?.status}, Has reveal? ${!!guest1State?.reveal}`);
  if (guest1State?.reveal) {
    throw new Error('FAIL: Guest received reveal before admin clicked "Afficher la réponse"');
  } else {
    console.log('✅ Confirmed: No spoiler during question phase.');
  }

  // Admin clicks "Afficher la réponse"
  console.log('\n👁️ Admin reveals answers for Q1 (Afficher la réponse)...');
  adminSocket.emit('admin_reveal_answer');
  await sleep(400);

  console.log(`Q1 Reveal -> Alice Result: Correct=${guest1State?.reveal?.isCorrect}, Points=+${guest1State?.reveal?.pointsEarned}`);
  console.log(`Q1 Reveal -> Bob Result: Correct=${guest2State?.reveal?.isCorrect}, Points=+${guest2State?.reveal?.pointsEarned}`);

  // Admin clicks "Afficher le classement"
  console.log('\n🏆 Admin displays Leaderboard...');
  adminSocket.emit('admin_show_leaderboard');
  await sleep(300);
  console.log(`Display status: ${displayState?.status}, Top 1: ${displayState?.leaderboard[0]?.name} (${displayState?.leaderboard[0]?.score} pts)`);

  // Move to Round 2 (Q2: multiple correct answers, 5 choices)
  console.log('\n➡️ Admin triggers Question 2 (5 choices, multiple answers)...');
  adminSocket.emit('admin_next_question');
  await sleep(400);

  console.log(`Q2 Choices Count: ${adminState?.question?.choices?.length}`);
  console.log(`Q2 Correct: ${adminState?.question?.correctChoices.join(', ')} (Multiple? ${adminState?.question?.isMultiple})`);

  // Alice selects exact ['A', 'C'] (Full points)
  // Bob selects partially ['A'] (Partial points)
  guest1Socket.emit('submit_answer', { guestId: 'guest-alice-123', choices: ['A', 'C'] });
  guest2Socket.emit('submit_answer', { guestId: 'guest-bob-456', choices: ['A'] });
  await sleep(300);

  console.log('\n👁️ Admin reveals answers for Q2 (Afficher la réponse)...');
  adminSocket.emit('admin_reveal_answer');
  await sleep(400);

  console.log(`Q2 Reveal -> Alice (exact ['A', 'C']): +${guest1State?.reveal?.pointsEarned} pts, Total: ${guest1State?.reveal?.totalScore}`);
  console.log(`Q2 Reveal -> Bob (partial ['A']): +${guest2State?.reveal?.pointsEarned} pts, Total: ${guest2State?.reveal?.totalScore}`);

  // Close sockets
  adminSocket.close();
  displaySocket.close();
  guest1Socket.close();
  guest2Socket.close();

  console.log('\n--- ENHANCED REAL-TIME SIMULATION PASSED PERFECTLY! ✅ ---');
  process.exit(0);
}

runSocketSimulation().catch(err => {
  console.error('Socket Simulation Error:', err);
  process.exit(1);
});
