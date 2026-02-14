const ENTRIES = [
    // ===== MAIN STORY =====
    {
        id: "ms-001",
        type: "main_story",
        title: "Pre-First Invasion",
        era: "Pre-First Invasion",
        timeline: "+100 Years BC1 (Before Chapter 1)",
        content: "The World was similar to what we know now in real life, but slightly more technologically advanced. <ul><li>Manufactures such as Elysion, Missilis and Tetra existed but no exact detail on how big they were aside from Relics stating them to be enterprises. (Early Relics called them by Elysion Enterprises, Missilis Industries, and Tetra Entertainment).</li><li>Military strength similar to IRL or at least slightly more advanced.</li><li>Einkk stated that she is roughly 20 years old (Memory of Goddess secret cutscene) which puts her origins during Pre-First Invasion but no other specifics on who or what made her.</li><li>Based off Chapter 43, the VTC has existed for a long time and made many strides in the advancement of technology even before the creation of Nikkes.</li></ul>",
        locations: ["Earth"],
        tags: ["Humanity", "V.T.C."],
        image: "images/Chapter Thumbnails/Sky2.png",
        youtube: "",
        connections: []
    },
    
    {
        id: "ms-002",
        type: "main_story",
        title: "The First Invasion",
        era: "The First Invasion",
        timeline: "100 Years BC1 (Before Chapter 1)",
        content: "Raptures began to invade multiple countries in hordes causing devastation. <ul><li><strong>Theories concluded that Raptures originated from the Space Station.</strong> Theories were reinforced when it was discovered that the Raptures targeted various shuttle-launch locations around the world during the initial attack. <em>(RED ASH INFO)</em></li><li>Initial military response was ill-equipped and resulted in many casualties.</li><li>The use of thermonuclear weapons had little to no effect and some instances had Raptures firing it back at humans. <em>(OLD TALES)</em> <em>(GLUTTONY)</em></li><li>As a result of all these attacks, <strong>The United Forces of Humanity</strong> was formed to be a combined effort against the Rapture threat.</li><li>No information on <strong>VTC</strong> aside from it being a medical institute run by the church but it can be assumed that the same happened like the UFH.</li><li>The first Nikke, <strong>Liliweiss</strong>, was created which followed the 1st and 2nd Generation Grimms models as well as the Mass-Produced models.</li><li>Previously a mercenary, <strong>The Legendary Commander</strong> began to acquire fame and eventually became the commander for the newly formed Goddess Squad.</li><li>Humanity began to win against Raptures as Nikkes proved to be an effective weapon, but due to that Raptures began to evolve.</li></ul>",
        locations: ["Earth", "Space Station"],
        tags: ["Humanity", "U.F.H.", "V.T.C."],
        image: "images/Chapter Thumbnails/SpaceElevator.png",
        youtube: "",
        connections: [
            { target: "ms-001", type: "curved" }
        ]
    },
    
    // ===== EVENT STORY =====
    {
        id: "es-001",
        type: "event_story",
        title: "Festival of Shadows",
        era: "First Era",
        timeline: 50,
        content: "Event content.",
        characters: ["Priestess Ara"],
        locations: ["Temple"],
        tags: ["festival"],
        image: "",
        youtube: "",
        connections: []
    }
];
