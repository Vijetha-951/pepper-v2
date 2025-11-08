class DetailedReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = options;
  }

  onTestStart(test) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 Starting Test: ${test.title}`);
    console.log(`${'='.repeat(70)}\n`);
  }

  onTestResult(test, testResult) {
    const title = testResult.testResults[0]?.title || test.title;
    const status = testResult.numFailingTests === 0 ? '✅ PASSED' : '❌ FAILED';
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${status} Test: ${title}`);
    console.log(`${'='.repeat(70)}`);
    console.log(`Duration: ${(testResult.perfStats.end - testResult.perfStats.start) / 1000}s\n`);

    if (testResult.numFailingTests > 0) {
      console.log('📋 Failures:\n');
      testResult.testResults.forEach(result => {
        if (!result.pass) {
          console.log(`❌ ${result.title}`);
          if (result.err && result.err.message) {
            console.log(`\nError Message:`);
            console.log(result.err.message);
          }
          if (result.err && result.err.stack) {
            console.log(`\nStacktrace:`);
            console.log(result.err.stack);
          }
        }
      });
    }
  }

  onRunComplete(contexts, results) {
    const summary = results.testResults.reduce(
      (acc, result) => ({
        total: acc.total + result.numPassingTests + result.numFailingTests,
        passed: acc.passed + result.numPassingTests,
        failed: acc.failed + result.numFailingTests,
        duration: acc.duration + (result.perfStats.end - result.perfStats.start)
      }),
      { total: 0, passed: 0, failed: 0, duration: 0 }
    );

    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(70)}`);
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);
    console.log(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    console.log(`${'='.repeat(70)}\n`);
  }
}

module.exports = DetailedReporter;
