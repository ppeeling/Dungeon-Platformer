/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-8 font-mono tracking-widest text-center">
        DUNGEON PLATFORMER
      </h1>
      <GameCanvas />
    </div>
  );
}
