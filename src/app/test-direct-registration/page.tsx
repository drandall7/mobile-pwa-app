'use client';

import { useState } from 'react';

export default function TestDirectRegistration() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: '+18048950976',
          password: 'TestPassword123',
          name: 'Test User',
          email: 'test@example.com',
        }),
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Direct Registration</h1>
      
      <button
        onClick={testRegistration}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Registration'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
