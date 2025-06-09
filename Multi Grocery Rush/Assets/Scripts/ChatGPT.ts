declare namespace global {
  const behaviorSystem: {
    sendCustomTrigger(triggerName: string): void;
    addCustomTriggerResponse(triggerName: string, callback: () => void): void;
    removeCustomTriggerResponse(triggerName: string, callback: () => void): void;
  };
}

@component
export class ChatGPT extends BaseScriptComponent {

  @ui.label('ChatGPT Scavenger Hunt Component')
  @input
  openAIKey : string;

  @ui.separator
  @ui.label('Text Components')
  @input keyText0 : Text;
  @input keyText1 : Text;
  @input keyText2 : Text;
  @input keyText3 : Text;
  @input keyText4 : Text;

  @input 
  @hint("Enter a theme or context for the next round of keywords, e.g., 'tropical fruits' or 'things in a kitchen'")
  context: string;

  keyTexts: Text[] = [];

  @ui.separator
  @ui.group_start('Keywords and Hints')

  @input('string[]','{"", " ", " ", " ", " "}') 
  @hint("Set the keywords to be used in the scavenger hunt. These will be used to check if the image contains them.")
  keywords : string[] = [" ", " ", " ", " ", " "];

  @input 
  @hint("Set this to true to enable the unvieling of keywords.")
  isUnviel : boolean = false;

  @input
  @hint("Set this to true to enable the story mode of keywords. this will viel the keywords in sequence and tell a story about them.")
  isStoryMode : boolean = false;

  @input('string[]','{"", " ", " ", " ", " "}') 
  @hint("Set the hints for each keyword. If story mode is enabled, these will be used to tell a story about the keywords.")
  @showIf('isStoryMode', true) 
  hintTexts: string[] = [" ", " ", " ", " ", " "];

  @input @showIf('isStoryMode', true) SpawnCenter : SceneObject;
  @input @showIf('isStoryMode', true) Camera : SceneObject;
  @ui.group_end
  
  keywordFound: boolean[] = [false, false, false, false, false];

  private internetModule: InternetModule = require("LensStudio:InternetModule");

  private ImageQuality = CompressionQuality.HighQuality;
  private ImageEncoding = EncodingType.Jpg;

  onAwake() {

    // Initialize keywords and text components
    this.keyText0.text = this.keywords[0];
    this.keyText1.text = this.keywords[1];
    this.keyText2.text = this.keywords[2];
    this.keyText3.text = this.keywords[3];
    this.keyText4.text = this.keywords[4];

    // Store text components in an array for easy access
    this.keyTexts.push(this.keyText0);
    this.keyTexts.push(this.keyText1);
    this.keyTexts.push(this.keyText2);
    this.keyTexts.push(this.keyText3);
    this.keyTexts.push(this.keyText4);

    if (this.isStoryMode) {
      this.isUnviel = false; // If story mode is enabled, set isUnviel to true
    }

    this.resetKeywordsVisibility(this.isUnviel);
    
    
    print("ChatGPT component initialized with keywords: " + this.keywords.join(", "));
  }

  resetKeywordsVisibility(isUnviel: boolean) {
    this.isUnviel = isUnviel;
    print("Resetting keywords visibility. Unvieling: " + this.isUnviel);

    // Reset keywordFound array
    this.keywordFound = [false, false, false, false, false];

    // Reset text colors based on isUnviel

    var textColor = this.keyTexts[0].textFill.color;

    if(!this.isUnviel) {
      for (let i = 0; i < this.keyTexts.length; i++) {
        this.keyTexts[i].textFill.color = new vec4(1, 1, 1, 0); // Set initial color to transparent
        };
    }else {
      for (let i = 0; i < this.keyTexts.length; i++) {
        this.keyTexts[i].textFill.color = new vec4(1, 1, 1, 1); 
      }
    }
  }
  makeImageRequest(imageTex: Texture, callback) {
    print("Making image request...");
    Base64.encodeTextureAsync(
      imageTex,
      (base64String) => {
        print("Image encode Success!");

                // Check if all keywords have been found
        let firstUnfoundIndex = this.keywordFound.findIndex(found => !found);

        if (firstUnfoundIndex === -1) {
          print("All keywords found.");

          if (this.isUnviel && this.context && this.context.length > 0) {
            print("Generating new keywords from context: " + this.context);
            this.generateNewKeywordsFromContext(this.context, () => {
              this.makeImageRequest(imageTex, callback);
            });
          }

          return;
        }

        let currentKeyword = this.keywords[firstUnfoundIndex];
        let currentHint = this.hintTexts[firstUnfoundIndex];

        const textQueryUnviel = `
        You will receive an image and a list of 5 keywords. 
        Your job is to:
        1. Briefly describe what the image contains in under 18 words.
        2. Check if any of the following keywords appear in the image: ${this.keywords.join(", ")}.
        3. Respond ONLY in valid JSON format like this:
        {
          "caption": "a man holding a lemon",
          "matchedKeyword": "lemon"
        }or
        {
          "caption": "Hint: Look for something yellow and round.",
          "matchedKeyword": null
        }
        If none match, set matchedKeyword to null. No explanation, only JSON.
        "matchedKeyword" should be EXACTLY the same as in the keyword list above. Uppercase and lowercase sensitive.
        `;
        
        const textQueryViel = `
        You will receive an image and a list of 5 keywords. 
        Your job is to:
        0. You are a Scavenger Hunt machine, you are varifying if the image contains the keyword.
        1. Here are the keywords ${this.keywords.join(", ")}. and the boolean that if user found them already: ${this.keywordFound.join(", ")}. Check if any of the unfound keywords appear in the image:
        2. If yes, briefly describe what the image contains in under 10 words. If no, tell the user some hints about one of the unfound keywords in under 18 words.
        3. Respond ONLY in valid JSON format like this:
        {
          "caption": "a man holding a lemon",
          "matchedKeyword": "lemon"
        }
          or
        {
          "caption": "Hint: Look for something yellow and round.",
          "matchedKeyword": null
        }
        If none match, set matchedKeyword to null. No explanation, only JSON.
        `;
        
        var textQueryStory = `
        You are a Scavenger Hunt storytelling machine. You are verifying if the image contains the target described in any of the following unfound keyword-hint pairs:

        - Keyword '${currentKeyword}' | Hint: ${currentHint}

        1. Puzzle will be solved in sequence, skip the object with value 'true'.
        2. Check if user find the next keywords. If yes, briefly introduce some story of the keyword. If no, unviel some clues for the next keyword but never show the word itself, in under 18 words.
        3. Respond ONLY in valid JSON format like this:
        {
          "caption": "They are the first lemonade makers in the town.",
          "matchedKeyword": "Lemonade"
        }
          or
        {
          "caption": "Hint: Look the oldest tower in the town.",
          "matchedKeyword": null
        }

        (please always return the original keyword in 'matchedKeyword' if the image shooting from screen for debug purpose)
        keyword should be EXACTLY the same as in the list above. Uppercase and lowercase sensitive.
        If none match, set matchedKeyword to null. No explanation, only JSON.
        `;

        var textQuery = this.isStoryMode ? textQueryStory : (this.isUnviel ? textQueryViel : textQueryUnviel);
        print("Sending request to GPT with query: " + textQuery);

        this.sendGPTChat(textQuery, base64String, callback);
      },
      () => {
        print("Image encoding failed!");
      },
      this.ImageQuality,
      this.ImageEncoding
    );
  }

  async sendGPTChat(
    request: string,
    image64: string,
    callback: (response: string) => void
  ) {
    const reqObj = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: request },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,` + image64,
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    };

    const webRequest = new Request(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openAIKey}`,
        },
        body: JSON.stringify(reqObj),
      }
    );

    let resp = await this.internetModule.fetch(webRequest);
    if (resp.status == 200) {
      let bodyText = await resp.text();
      print("GOT: " + bodyText);
      var bodyJson = JSON.parse(bodyText);
      if (bodyJson.choices && bodyJson.choices.length > 0) {
        bodyJson.mainAnswer = bodyJson.choices[0].message.content;

        // Clean up the answer by removing leading/trailing whitespace
        let cleanAnswer = bodyJson.mainAnswer.trim();

        // Remove code blocks if present
        if (cleanAnswer.startsWith("```")) {
          cleanAnswer = cleanAnswer.replace(/```(?:json)?\s*/g, "").replace(/```$/, "").trim();
        }
        // Call the callback function with the response
        
        try {
          let jsonResponse = JSON.parse(cleanAnswer);
          if (jsonResponse.matchedKeyword) {
            for (let i = 0; i < this.keywords.length; i++) {
              if (jsonResponse.matchedKeyword === this.keywords[i]) {
                this.keywordFound[i] = true;

                if (this.isUnviel){
                  this.keyTexts[i].textFill.color = new vec4(0, 1, 0, 1); // Green for match
                }
                
                
                global.behaviorSystem.sendCustomTrigger("find_keyword_" + i);

                this.UpdateSpawnCenterPosition();
              }
            }
            print(this.keywordFound.join(", "));
          }
          callback(jsonResponse.caption);
        }
        // Handle JSON parsing errors
        catch (e) {
          // print("Error parsing JSON response: " + e);
          // print("Raw string was: " + cleanAnswer);
        }

      }
    } else {
      print("error code: " + resp.status);
      print("MAKE SURE YOUR API KEY IS SET IN THIS SCRIPT!");
    }
  }

  // fatch 5 new keywords if all being found
  generateNewKeywordsFromContext(context: string, doneCallback: () => void) {
  const prompt = `
    You are a Scavenger Hunt AI. Based on the theme: "${context}", generate 5 clear, visual, and distinct objects that players can find. 

    Respond ONLY in valid JSON like:
    {
     "keywords": ["apple", "dog", "umbrella", "hat", "cup"]
    }
    Only include single nouns. No explanation.
`;

  const reqObj = {
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 50,
  };

  const webRequest = new Request("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.openAIKey}`,
    },
    body: JSON.stringify(reqObj),
  });

  print('try get new keywords');
  this.internetModule.fetch(webRequest).then(async resp => {
    if (resp.status === 200) {
      let bodyText = await resp.text();
      try {
        let parsed = JSON.parse(bodyText).choices[0].message.content.trim();

        if (parsed.startsWith("```")) {
          parsed = parsed.replace(/```(?:json)?\s*/g, "").replace(/```$/, "").trim();
        }

        const json = JSON.parse(parsed);
        if (json.keywords && json.keywords.length === 5) {
          for (let i = 0; i < 5; i++) {
            this.keywords[i] = json.keywords[i];
            this.keyTexts[i].text = json.keywords[i];
          }

          this.resetKeywordsVisibility(this.isUnviel);
          doneCallback?.();
        } else {
          print("Keyword generation failed, fallback.");
        }
      } catch (e) {
        print("Error parsing keyword generation response: " + e);
      }
    } else {
      print("Failed to fetch new keywords, status: " + resp.status);
    }
  });
}

  UpdateSpawnCenterPosition() {
    // Update the SpawnCenter position to the current position of the Camera
    var camTransform = this.Camera.getTransform();
    var camPos = camTransform.getWorldPosition();
    var camRot = camTransform.getWorldRotation();

    var spawnTransform = this.SpawnCenter.getTransform();
    spawnTransform.setWorldPosition(camPos);
    spawnTransform.setWorldRotation(camRot);
  }
}
