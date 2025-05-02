const Team = require("../models/Teams");
const { uploadImage, deleteImage } = require("../utils/cloudinaryService");
const fs = require("fs");

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    const locale = req.query.locale || ""; // Default to empty string if locale is not provided
    // Transform the response based on the locale
    const transformedTeams = teams.map((team) => {
      const teamData = {
        id: team._id,
        name: team.name,
        image: team.image,
        instagram: team.instagram,
        linkedin: team.linkedin,
        github: team.github,
        telegram: team.telegram,
      };

      if (locale) {
        // If locale is provided, return only the description for that locale
        return {
          ...teamData,
          description: team.translations[locale]?.description || team.translations["uz"].description,
          position: team.translations[locale]?.position || team.translations["uz"].position,
        };
      } else {
        // If no locale is provided, return the full translations object
        return {
          ...teamData,
          translations: team.translations,
        };
      }
    });

    res.json({
      teams: transformedTeams,
      count: transformedTeams.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a new team member (Multer middleware will be applied in the route)
exports.addTeamMember = async (req, res) => {
  try {
    // Log the raw fields and files for debugging
    console.log("Received fields:", req.body);
    console.log("Received files:", req.file);
    // Extract fields from form-data
    const name = req.body.name?.toString();
    const instagram = req.body.instagram?.toString();
    const linkedin = req.body.linkedin?.toString();
    const github = req.body.github?.toString();
    const telegram = req.body.telegram?.toString();

    // Initialize the translations object
    const translations = {};
    const supportedLocales = ["uz", "ru", "uz-kr", "qq", "en"];

    // Check if translations is provided as a JSON string
    if (req.body.translations) {
      let parsedTranslations;
      try {
        parsedTranslations = JSON.parse(req.body.translations.toString());
        console.log("Parsed translations (JSON string):", parsedTranslations);
        // Ensure parsedTranslations is an object
        if (typeof parsedTranslations !== "object" || parsedTranslations === null) {
          return res.status(400).json({
            message: "Invalid translations format. Must be a JSON object.",
          });
        }
        // Copy parsed translations into the translations object
        Object.assign(translations, parsedTranslations);
      } catch (parseError) {
        console.error("Error parsing translations:", parseError);
        return res.status(400).json({
          message: "Invalid translations format. Must be valid JSON.",
          error: parseError.message,
        });
      }
    } else {
      // Otherwise, reconstruct translations from individual fields
      for (const locale of supportedLocales) {
        const positionKey = `translations[${locale}][position]`;
        const descriptionKey = `translations[${locale}][description]`;
        translations[locale] = {
          position: req.body[positionKey]?.toString(),
          description: req.body[descriptionKey]?.toString(),
        };
      }
    }

    // Log the final translations object
    console.log("Final translations:", translations);

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!instagram) {
      return res.status(400).json({ message: "Instagram URL is required" });
    }
    if (!linkedin) {
      return res.status(400).json({ message: "LinkedIn URL is required" });
    }
    if (!github) {
      return res.status(400).json({ message: "GitHub URL is required" });
    }

    // Validate translations
    for (const locale of supportedLocales) {
      if (!translations[locale]?.position || !translations[locale]?.description) {
        console.log(`Validation failed for locale ${locale}:`, translations[locale]);
        return res.status(400).json({
          message: `Position and description are required for locale: ${locale}`,
        });
      }
    }

    // Handle image upload
    let imageData = { url: "", publicId: "" };
    if (req.file) {
      try {
        console.log("Uploading image to Cloudinary:", req.file);
        imageData = await uploadImage(req.file, "teams");
        console.log("Cloudinary response:", imageData);
        if (!imageData.url || !imageData.publicId) {
          throw new Error("Cloudinary upload failed: Invalid response (missing URL or publicId)");
        }
        // Delete the temporary file
        console.log("Deleting temporary file:", req.file.path);
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Failed to upload image to Cloudinary",
          error: uploadError.message,
        });
      }
    } else {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Create the team member object
    const teamData = {
      name,
      image: imageData.url,
      instagram,
      linkedin,
      github,
      telegram,
      translations, // Save the entire translations object
    };

    // Save to the database
    console.log("Saving team data:", teamData);
    const team = await Team.create(teamData);
    res.status(201).json(team);
  } catch (err) {
    console.error("Error creating team member:", err);
    // Clean up the temporary file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteError) {
        console.error("Error deleting temporary file:", deleteError);
      }
    }
    res.status(500).json({ message: err.message });
  }
};