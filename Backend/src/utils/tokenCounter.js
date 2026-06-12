// this is a function that takes the text entered by the user and then calculates the approximate number of tokens in the LLM that this text will consume.
// Here, it is assumed that around 4 characters, constitute a token for text/code in english
export function estimateTokensFromText(text){
    return Math.ceil((text?.length || 0)/4) // this is the approx number of tokens
}

export function estimatePromptTokens(prompt, messages){
    let total = estimateTokensFromText(prompt); // get the number of tokens needed for the prompt given
    for(const message of messages){
        total+=(estimateTokensFromText(message.conent) + 4) // then we add the number of tokens for every message in the context and an additional 4 tokens as overhead
    }
    return total
}