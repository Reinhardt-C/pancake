class Pancake {
	static lex(str) {
		let currentPosition = 0;
		let buffer = "";
		let currentType = null;
		let tokens = [];
		while (currentPosition < str.length) {
			let char = str[currentPosition];
			if (char == "\n") {
				currentPosition++;
				continue;
			}
			if (/\s/.test(char) && buffer.length > 0 && currentType !== "STRING") {
				tokens.push(new Token(currentType, buffer));
				currentType = null;
				buffer = "";
				currentPosition++;
				continue;
			}
			if (currentType == null) {
				if (char == "'") {
					currentType = "STRING";
				} else if (/\d/.test(char)) {
					currentType = "NUMBER";
				} else if (/\w/.test(char)) {
					currentType = "KEYWORD";
				}
			} else {
				if (currentType == "STRING" && char == "'" && buffer[buffer.length - 1] !== "\\") {
					buffer += char;
					tokens.push(new Token("STRING", buffer));
					buffer = "";
					currentType = null;
					currentPosition++;
					continue;
				} else if (currentType == "NUMBER" && !/\d/.test(char))
					throw "SyntaxError: Unexpected " + char;
				else if (currentType == "KEYWORD" && /\d/.test(char))
					throw "SyntaxError: Unexpected " + char;
			}
			buffer += char;
			currentPosition++;
		}
		if (buffer.length > 0) {
			tokens.push(new Token(currentType, buffer));
			currentType = null;
			buffer = "";
		}
		return tokens;
	}

	static parse(tokens) {
		let permtokens = [...tokens];
		let stacks = {};
		let orders = {};
		let condition;
		let pancake;
		while (tokens.length > 0) {
			let token = tokens.shift();
			if (token.type !== "KEYWORD") continue;
			if (condition !== undefined && pancake !== condition) {
				condition = undefined;
				continue;
			}
			switch (token.value) {
				case "plate":
					stacks[tokens.shift().value] = [];
					break;
				case "bake":
					pancake = tokens.shift().raw;
					break;
				case "flip":
					console.log(pancake);
					break;
				case "push":
					stacks[tokens.shift().value].push(pancake);
					pancake = undefined;
					break;
				case "pop":
					pancake = stacks[tokens.shift().value].pop();
					break;
				case "butter":
					pancake++;
					break;
				case "melt":
					pancake--;
					break;
				case "neworder":
					orders[tokens.shift().value] = permtokens.length - tokens.length;
					break;
				case "order":
					tokens = permtokens.slice(orders[tokens.shift().value]);
					break;
				case "require":
					condition = tokens.shift().raw;
					break;
			}
		}
	}

	static run(str) {
		Pancake.parse(Pancake.lex(str));
	}
}

class Token {
	constructor(type, value) {
		this.type = type;
		this.value = type == "STRING" ? value : value.replace(/\s/, "");
	}

	get raw() {
		if (this.type == "STRING") return this.value.slice(1, -1);
		if (this.type == "NUMBER") return parseFloat(this.value);
		return "";
	}
}

fetch("example.pancake")
	.then(r => r.text())
	.then(Pancake.run);
