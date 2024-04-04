const available = () => !!window.showSaveFilePicker;

const showSaveFilePicker = fileName => window.showSaveFilePicker({
    suggestedName: fileName,
    types: [
        {
            description: 'Usbq Project',
            accept: {
                'application/x.usbq.uqb1': '.uqb1'
            }
        },
        {
            description: 'Scratch 3 Project',
            accept: {
                'application/x.scratch.sb3': '.sb3'
            }
        }
    ],
    excludeAcceptAllOption: true
});

const showOpenFilePicker = async () => {
    const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
            {
                description: 'Usbq Project',
                accept: {
                    'application/x.usbq.uqb1': ['.uqb1']
                }
            },
            {
                description: 'Scratch Project',
                accept: {
                    'application/x.scratch.sb3': ['.sb', '.sb2', '.sb3']
                }
            },
            {
                description: 'ZIP File',
                accept: {
                    'application/zip': ['.zip']
                }
            }
        ]
    });
    return handle;
};

export default {
    available,
    showOpenFilePicker,
    showSaveFilePicker
};
