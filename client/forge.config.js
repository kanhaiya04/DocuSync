module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Kanhaiya Yadav',
        description: 'Collabrative tool for Docs',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
    // Snap maker disabled - too many issues with multipass/LXD in CI
    // Build snap manually if needed or publish deb/rpm packages instead
    // {
    //   name: '@electron-forge/maker-snap',
    //   config: {
    //     summary: 'Collaborative tool for Docs',
    //     description: 'DocSync is a collaborative document editing tool that allows real-time collaboration on documents.',
    //     grade: 'stable',
    //     confinement: 'strict',
    //     architectures: ['amd64'],
    //     base: 'core20',
    //   },
    // },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
