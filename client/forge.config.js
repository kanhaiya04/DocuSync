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
    {
      name: '@electron-forge/maker-snap',
      config: {
        summary: 'Collaborative tool for Docs',
        description: 'DocSync is a collaborative document editing tool that allows real-time collaboration on documents.',
        grade: 'stable',
        confinement: 'strict',
        architectures: ['amd64'],
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
