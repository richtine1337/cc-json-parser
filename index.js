const fs = require('fs');
const path = require('path');
const readline = require('readline');
const process = require('process')
const parser = require('parser');

const CARD_NUMBER = /((?:(?:4\d{3})|(?:5[1-5]\d{2})|6(?:011|5[0-9]{2}))(?:-?|\s?)(?:\d{4}(?:-?|\s?)){3}|(?:3[4,7]\d{2})(?:-?|\s?)\d{6}(?:-?|\s?)\d{5})/;
const CARD_DATE = /\b(\d{1,2})[\\.\ /\-](\d{2}|\d{4})\b/;
const CARD_CVV = /\b(\d{3})\b/;

let cards = [];
let expiredCards = [];




async function initialize() {
  console.log(getAscii());
  const filePath = await getInput("Please drag and drop your JSON file here: ");

  if (!filePath.endsWith('.json')) {
    console.log("ERROR: Wrong file type (*.json only)");
    console.log("STOPPED!");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.log("ERROR: File not found");
    process.exit(1);
  }

  console.log("\nFile compiling...\n");

  const content = fs.readFileSync(filePath.trim(), 'utf-8');
  const jsonObject = JSON.parse(content);
  const conversations = jsonObject.conversations;

  conversations.forEach(conversation => {
    const messages = conversation.MessageList;
    messages.forEach(message => {
      let content = message.content;
      try {
        content = content.replace(/\n/g, ' '); 
        findCard(content);
      } catch (error) {
        console.error("Error processing message content:", error);
      }
    });
  });

  if (cards.length === 0 && expiredCards.length === 0) {
    console.log("Nothing found");
    return;
  }

  const outputFileName = 'output.txt';
  const expiredFileName = '-expired-output.txt';

  cards = [...new Set(cards)]; 
  expiredCards = [...new Set(expiredCards)]; 

  if (cards.length > 0) {
    console.log("\nTotal found valid cards:", cards.length);
    fs.writeFileSync(outputFileName, cards.join('\n') + `\nTotal found cards (${cards.length})`, 'utf-8');
    console.log("\nSUCCESS (valid cards):", path.resolve(outputFileName));
  }

  if (expiredCards.length > 0) {
    console.log("\nTotal found expired cards:", expiredCards.length);
    fs.writeFileSync(expiredFileName, expiredCards.join('\n') + `\nTotal expired cards (${expiredCards.length})`, 'utf-8');
    console.log("\nSUCCESS (expired cards):", path.resolve(expiredFileName));
  parser.exit();
  }
}

function findCard(string) {
  const cardNumber = string.match(CARD_NUMBER);
  const cardDate = string.match(CARD_DATE);
  const cardCVV = string.match(CARD_CVV);

  if (cardNumber && cardDate && cardCVV) {
    const card = cardNumber[0];
    const month = monthFix(cardDate[1]);
    const year = yearFix(cardDate[2]);

    const cardYear = parseInt(year, 10);
    if (cardYear < 1900 || cardYear > 2100) {
      console.log(`Invalid card year found: ${cardYear}`);
      return;
    }

    const cvv = cardCVV[1];
    let total = `${card}|${month}|${year}|${cvv}`;

    if (isExpired(month, year)) {
      expiredCards.push(total);
    } else {
      cards.push(total);
    }
  }
}

function monthFix(month) {
  return month.length === 2 ? month : `0${month}`;
}

function yearFix(year) {
  if (year.length === 4) {
    return year;
  } else if (year.length === 2) {
    const currentYear = new Date().getFullYear() % 100; // Last two digits of the current year
    return parseInt(year, 10) <= currentYear ? `20${year}` : `19${year}`;
  } else {
    throw new Error(`Invalid year format: ${year}`);
  }
}

function isExpired(month, year) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const cardYear = parseInt(year, 10);
  const cardMonth = parseInt(month, 10);

  return cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth);
}

function getInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(prompt, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function getAscii() {
  return `


                                                                                     
  1111111         333333333333333         333333333333333        77777777777777777777
 1::::::1        3:::::::::::::::33      3:::::::::::::::33      7::::::::::::::::::7
1:::::::1        3::::::33333::::::3     3::::::33333::::::3     7::::::::::::::::::7
111:::::1        3333333     3:::::3     3333333     3:::::3     777777777777:::::::7
   1::::1                    3:::::3                 3:::::3                7::::::7 
   1::::1                    3:::::3                 3:::::3               7::::::7  
   1::::1            33333333:::::3          33333333:::::3               7::::::7   
   1::::l            3:::::::::::3           3:::::::::::3               7::::::7    
   1::::l            33333333:::::3          33333333:::::3             7::::::7     
   1::::l                    3:::::3                 3:::::3           7::::::7      
   1::::l                    3:::::3                 3:::::3          7::::::7       
   1::::l                    3:::::3                 3:::::3         7::::::7        
111::::::111     3333333     3:::::3     3333333     3:::::3        7::::::7         
1::::::::::1     3::::::33333::::::3     3::::::33333::::::3       7::::::7          
1::::::::::1     3:::::::::::::::33      3:::::::::::::::33       7::::::7           
111111111111      333333333333333         333333333333333        77777777            
                                                                                     
                                                                                     

  `;
}

initialize();
