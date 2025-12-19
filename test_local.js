import { runCitizensAudit } from './rpa/citizens/citizensBot.js';
import config from './rpa/citizens/demoConfig.js'
import { performance } from 'perf_hooks'; // Built-in Node module

// Replace with a real policy number you want to test
// const TEST_POLICIES = ['08586014', 
// '11532428',
// '15523289',
// '15532064']; 

const testData = [
    // {
    //     "dealboard_id": "66bb27a35abe5e6ec3043739",
    //     "policyRenewalStatus": "active",
    //     "policy_number": "11065602"
    // },
    // {
    //     "dealboard_id": "66bb27a35abe5e6ec3043777",
    //     "policyRenewalStatus": "active",
    //     "policy_number": "11065646"
    // },
    // {
    //     "dealboard_id": "692174cdf02c7044ac76ce0f",
    //     "policy_number": "CD-0000008933-00"
    // },
    // {
    //     "dealboard_id": "68ff2e0eda30585db24565c5",
    //     "policy_number": "08750377",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6903227400d4f83805efc519",
    //     "policy_number": "11653468"
    // },
    // {
    //     "dealboard_id": "690473ff3dd86250a664f0ee",
    //     "policy_number": "11491933"
    // },
    // {
    //     "dealboard_id": "690474003dd86250a664f1e8",
    //     "policy_number": "11612282"
    // },
    // {
    //     "dealboard_id": "690474033dd86250a664f459",
    //     "policy_number": "08722062"
    // },
    // {
    //     "dealboard_id": "690717060ec70c6c1a5a1e8f",
    //     "policy_number": "06332576",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "690717060ec70c6c1a5a1ea8",
    //     "policy_number": "08752568",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6908687ed188a77ea4bf5108",
    //     "policy_number": "04564024"
    // },
    // {
    //     "dealboard_id": "690b0b75f90b1e38787374df",
    //     "policy_number": "11426154"
    // },
    // {
    //     "dealboard_id": "690b0b76f90b1e387873755c",
    //     "policy_number": "11700588"
    // },
    // {
    //     "dealboard_id": "690b0b77f90b1e387873763d",
    //     "policy_number": "08922561"
    // },
    // {
    //     "dealboard_id": "690b0b77f90b1e38787376ba",
    //     "policy_number": "06355422",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "690c5d91c4baf45f7893a3ff",
    //     "policy_number": "08878144",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "690c5d94c4baf45f7893a575",
    //     "policy_number": "11569738"
    // },
    // {
    //     "dealboard_id": "690c5da2c4baf45f7893aa82",
    //     "policy_number": "09656041"
    // },
    // {
    //     "dealboard_id": "691597b259f2450c57b4c28b",
    //     "policy_number": "11728088"
    // },
    // {
    //     "dealboard_id": "691597b359f2450c57b4c40e",
    //     "policy_number": "11681366",
    //     "policyRenewalStatus": "reinstate"
    // },
    // {
    //     "dealboard_id": "691597b459f2450c57b4c476",
    //     "policy_number": "08902037"
    // },
    // {
    //     "dealboard_id": "6916e91e1cf9351535f01f8e",
    //     "policy_number": "11552150"
    // },
    // {
    //     "dealboard_id": "6916e9201cf9351535f02111",
    //     "policy_number": "08992314"
    // },
    // {
    //     "dealboard_id": "69198c18d4c3fe2b57bd3b02",
    //     "policy_number": "06385144",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "69198c18d4c3fe2b57bd3b6a",
    //     "policy_number": "06384391",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "691d806c9f54231031df0983",
    //     "policy_number": "08834840"
    // },
    // {
    //     "dealboard_id": "691d806c9f54231031df09d1",
    //     "policy_number": "06408357",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "691d806d9f54231031df0ab9",
    //     "policy_number": "06287252",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "691ed1ebd273a127ae062f49",
    //     "policy_number": "08941097"
    // },
    // {
    //     "dealboard_id": "691ed1edd273a127ae063081",
    //     "policy_number": "06349288",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6920236db9a4b73983bf3cae",
    //     "policy_number": "11612192",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "692174d2f02c7044ac76d27f",
    //     "policy_number": "08954341",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6922c655f02c7044ac7db934",
    //     "policy_number": "08876758",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "692417eba5c425077c6cf42b",
    //     "policy_number": "11797886"
    // },
    // {
    //     "dealboard_id": "691ed1f1d273a127ae063513",
    //     "policy_number": "08847799",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "69256964d941331fe94f26a0",
    //     "policy_number": "08971769",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6926bb4cc635813837e69797",
    //     "policy_number": "11776441"
    // },
    // {
    //     "dealboard_id": "6926bb4cc635813837e697cb",
    //     "policy_number": "06326756",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "69280cc1caa1513d56c49390",
    //     "policy_number": "11680969"
    // },
    // {
    //     "dealboard_id": "69280cc4caa1513d56c49558",
    //     "policy_number": "06445783"
    // },
    // {
    //     "dealboard_id": "69280cc8caa1513d56c497e8",
    //     "policy_number": "11644951"
    // },
    // {
    //     "dealboard_id": "69295e20d7c1635f02f52e3b",
    //     "policy_number": "11611787"
    // },
    // {
    //     "dealboard_id": "69295e22d7c1635f02f52e6f",
    //     "policy_number": "11832483"
    // },
    // {
    //     "dealboard_id": "69295e26d7c1635f02f52fa7",
    //     "policy_number": "04686791",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "69295e2ad7c1635f02f53113",
    //     "policy_number": "04718871",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "692aaf9826826f6a06a10411",
    //     "policy_number": "04649832"
    // },
    // {
    //     "dealboard_id": "692aaf9926826f6a06a10479",
    //     "policy_number": "09050402"
    // },
    // {
    //     "dealboard_id": "692c011291cf651102c014a5",
    //     "policy_number": "06366041",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "6926bb64c635813837e6a005",
    //     "policy_number": "09016964"
    // },
    // {
    //     "dealboard_id": "692d52d704bf6a119743bc5a",
    //     "policy_number": "04716221"
    // },
    // {
    //     "dealboard_id": "69295e33d7c1635f02f5346d",
    //     "policy_number": "11745061"
    // },
    // {
    //     "dealboard_id": "692ff66aab56e94a44f7e1a9",
    //     "policy_number": "04688280",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "692ff66dab56e94a44f7e428",
    //     "policy_number": "11697399"
    // },
    // {
    //     "dealboard_id": "692ff670ab56e94a44f7e648",
    //     "policy_number": "06470837"
    // },
    // {
    //     "dealboard_id": "6931471e89df8c67b3037666",
    //     "policy_number": "11896236"
    // },
    // {
    //     "dealboard_id": "6931472489df8c67b30378a4",
    //     "policy_number": "04730703"
    // },
    // {
    //     "dealboard_id": "693298bfd790977354912b26",
    //     "policy_number": "09124220"
    // },
    // {
    //     "dealboard_id": "693298c2d790977354912dda",
    //     "policy_number": "09124114",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "693298c4d790977354912ed1",
    //     "policy_number": "09123973"
    // },
    // {
    //     "dealboard_id": "6933ea014fac5d0615fd439f",
    //     "policy_number": "08953345",
    //     "policyRenewalStatus": "reinstate"
    // },
    // {
    //     "dealboard_id": "6933ea034fac5d0615fd443b",
    //     "policy_number": "06398410"
    // },
    // {
    //     "dealboard_id": "69368d5e2937f96684a84b4b",
    //     "policy_number": "04739651"
    // },
    // {
    //     "dealboard_id": "6937df0108b56748bc5611c5",
    //     "policy_number": "11883157",
    //     "policyRenewalStatus": "reinstate"
    // },
    // {
    //     "dealboard_id": "6937df0108b56748bc561215",
    //     "policy_number": "09030978"
    // },
    // {
    //     "dealboard_id": "690daea5bb0323025884a8a5",
    //     "policy_number": "06375426",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "693d248f6b7175063ad4dfa6",
    //     "policy_number": "06551995"
    // },
    // {
    //     "dealboard_id": "693d24916b7175063ad4e028",
    //     "policy_number": "04675110"
    // },
    // {
    //     "dealboard_id": "693d24926b7175063ad4e05c",
    //     "policy_number": "09198545"
    // },
    // {
    //     "dealboard_id": "693bd378438dc86b68a48f8a",
    //     "policy_number": "06530782"
    // },
    // {
    //     "dealboard_id": "6939304e1e340c4ef9ce2af5",
    //     "policy_number": "04768127"
    // },
    // {
    //     "dealboard_id": "6912f49dad9b8063507130cf",
    //     "policyRenewalStatus": "active",
    //     "policy_number": "14083011"
    // },
    // {
    //     "dealboard_id": "6939304f1e340c4ef9ce2b5f",
    //     "policy_number": "04686817"
    // },
    // {
    //     "dealboard_id": "693fc7d13ba7ce3b4b615c1c",
    //     "policy_number": "06555447",
    //     "policyRenewalStatus": "reinstate"
    // },
    // {
    //     "dealboard_id": "693fc7d13ba7ce3b4b615c36",
    //     "policy_number": "04681297"
    // },
    // {
    //     "dealboard_id": "693e763b924e586b2e8491d6",
    //     "policy_number": "06460243"
    // },
    // {
    //     "dealboard_id": "693e763b924e586b2e84920a",
    //     "policy_number": "08993184"
    // },
    // {
    //     "dealboard_id": "6941193b492e0257b5718a71",
    //     "policy_number": "08992901"
    // },
    // {
    //     "dealboard_id": "6941193f492e0257b5718b75",
    //     "policy_number": "11989916",
    //     "policyRenewalStatus": "renewed"
    // },
    // {
    //     "dealboard_id": "69411943492e0257b5718c62",
    //     "policy_number": "09194002"
    // },
    {
        "dealboard_id": "69426b1e4504b05c5e4f7fa0",
        "policy_number": "08777155",
        "policyRenewalStatus": "renewed"
    },
    {
        "dealboard_id": "69426b3c4504b05c5e4f8dff",
        "policy_number": "04694072",
        "policyRenewalStatus": "renewed"
    },
    {
        "dealboard_id": "692ea481113c9a1158f16e2a",
        "policyRenewalStatus": "active",
        "policy_number": "14251887"
    },
    {
        "dealboard_id": "690daeabbb0323025884af7b",
        "policy_number": "11645073"
    },
    {
        "dealboard_id": "69368d712937f96684a856d6",
        "policyRenewalStatus": "active",
        "policy_number": "14239788"
    },
    {
        "dealboard_id": "6933ea224fac5d0615fd5007",
        "policyRenewalStatus": "active",
        "policy_number": "14316578"
    },
    {
        "dealboard_id": "6922c667f02c7044ac7dc8f1",
        "policy_number": "06395067"
    },
    {
        "dealboard_id": "693d24c86b7175063ad4f0f2",
        "policyRenewalStatus": "active",
        "policy_number": "14326986"
    },
    {
        "dealboard_id": "69295e4cd7c1635f02f53f7a",
        "policy_number": "08789307"
    },
    {
        "dealboard_id": "693bd391438dc86b68a49ced",
        "policy_number": "14257312"
    },
    {
        "dealboard_id": "6939309c1e340c4ef9ce41fc",
        "policyRenewalStatus": "reinstate",
        "policy_number": "14392099"
    },
    {
        "dealboard_id": "69329909d79097735491407d",
        "policyRenewalStatus": "active",
        "policy_number": "11813240"
    },
    {
        "dealboard_id": "691597db59f2450c57b4ebbc",
        "policy_number": "01562576"
    }
];

// Extract policies
const policiesToAudit = testData.map(p => p.policy_number);

async function test() {
    console.log("🧪 Starting Local Bot Test...");
    console.log(`📋 Loaded ${policiesToAudit.length} policies from demoConfig.`);

    const startTime = performance.now();

    try {
        const results = await runCitizensAudit(policiesToAudit);

        const endTime = performance.now(); // End Timer
        const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

        console.log("\n✅ Test Complete! Results:");
        console.log(`⏱️  Total Runtime: ${durationSeconds} seconds`);
        console.log(JSON.stringify(results, null, 2));

    } catch (error) {
        const endTime = performance.now();
        const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

        console.error(`\n❌ Fatal Error during execution (Runtime: ${durationSeconds}s):`, error);
    }
}

test();