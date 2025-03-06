import weaviate from 'weaviate-ts-client';
import { readFileSync, writeFileSync } from 'fs';

const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',
});

async function run() {
    // Check existing classes
    const schemaRes = await client.schema.getter().do();
    console.log(JSON.stringify(schemaRes, null, 2));

    // Delete class if it already exists
    try {
        await client.schema.classDeleter().withClassName("Memee").do();
        console.log("Deleted existing Memee class");
    } catch (err) {
        console.log("Class Memee does not exist or could not be deleted.");
    }

    // Define schema
    const schemaConfig = {
        class: "Memee",
        vectorizer: "img2vec-neural",
        vectorIndexType: "hnsw",
        moduleConfig: {
            "img2vec-neural": {
                imageFields: ["image"]
            }
        },
        properties: [
            { name: "image", dataType: ["blob"] },
            { name: "text", dataType: ["string"] }
        ]
    };

    // Create the class
    await client.schema.classCreator().withClass(schemaConfig).do();
    console.log("Created class Memee");

    // Read and encode the image
    const img = readFileSync("./img/hi-mom.jpg");
    const b64 = Buffer.from(img).toString("base64");

    // Insert image data
    await client.data.creator()
        .withClassName("Memee")
        .withProperties({ image: b64, text: "matrix meme" })
        .do();
    console.log("Inserted meme data");

    // Read query image
    const test = Buffer.from(readFileSync("./test1.jpg")).toString("base64");

    // Search for the most similar image
    const resImage = await client.graphql.get()
        .withClassName("Memee")
        .withFields(["image"])
        .withNearImage({ image: test })
        .withLimit(1)
        .do();

    // Check if a result was found before writing
    if (resImage?.data?.Get?.Memee?.length > 0) {
        const result = resImage.data.Get.Memee[0].image;
        writeFileSync("./result.jpg", result, "base64");
        console.log("Result image saved as result.jpg");
    } else {
        console.log("No similar image found.");
    }
}

// Run the function
run().catch(console.error);
