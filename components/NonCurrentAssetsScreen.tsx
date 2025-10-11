
import React, { useContext, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../App.tsx';
import { NonCurrentAsset, NonCurrentAssetType, NonCurrentAssetDetailsOtherInvestment } from '../types.ts';
import Button from './ui/Button.tsx';
import Modal from './ui/Modal.tsx';
import { formatDateReadable } from '../constants.ts';

const NonCurrentAssetsScreen: React.FC = () => {
  const context = useContext(AppContext);
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [assetToDelete, setAssetToDelete] = useState<NonCurrentAsset | null>(null);

  if (!context) return <div className="text-center py-10">Loading context...</div>;
  const { nonCurrentAssets, deleteNonCurrentAsset, isLoading, formatCurrency } = context;

  const handleDeleteClick = (asset: NonCurrentAsset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      deleteNonCurrentAsset(assetToDelete.id); // Toast handled in App.tsx
    }
    setShowDeleteModal(false);
    setAssetToDelete(null);
  };
  
  const getAssetTypeLabel = (type: NonCurrentAssetType): string => {
    // Replace underscores with spaces and capitalize words
    return type.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }

  const calculateGainLoss = (asset: NonCurrentAsset): number | null => {
      if (asset.type === NonCurrentAssetType.OTHER_INVESTMENT && asset.details) {
          const details = asset.details as NonCurrentAssetDetailsOtherInvestment;
          let acqCost = asset.acquisitionCost;
          let currVal = asset.currentValue;

          if ((acqCost === 0 || acqCost === undefined) && details.quantity && details.purchasePricePerUnit) {
              acqCost = details.quantity * details.purchasePricePerUnit;
          }
          if ((currVal === 0 || currVal === undefined) && details.quantity && details.currentPricePerUnit) {
              currVal = details.quantity * details.currentPricePerUnit;
          }
          
          if (acqCost > 0 && currVal !== undefined && currVal > 0) return currVal - acqCost;
      }
      if (asset.currentValue !== undefined && asset.acquisitionCost > 0 && asset.currentValue > 0) {
          return asset.currentValue - asset.acquisitionCost;
      }
      return null;
  }

  const sortedAssets = useMemo(() => {
    return [...nonCurrentAssets].sort((a, b) => new Date(b.acquisitionDate).getTime() - new Date(a.acquisitionDate).getTime());
  }, [nonCurrentAssets]);

  if (isLoading) return <div className="text-center py-10">Loading non-current assets...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-dark dark:text-gray-100">Non-Current Assets</h2>
        <Link to="/assets/new">
          <Button variant="primary" leftIcon={<i className="fas fa-plus"></i>}>Add New Asset</Button>
        </Link>
      </div>

      {sortedAssets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            <i className="fas fa-gem text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
            <p className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-2">No Assets Recorded.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Track your valuable non-current assets like property, vehicles, or investments.</p>
            <Link to="/assets/new">
                <Button variant="secondary" leftIcon={<i className="fas fa-plus-circle"></i>}>Add Your First Asset</Button>
            </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acq. Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acq. Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Current Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gain/Loss</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAssets.map(asset => {
                const gainLoss = calculateGainLoss(asset);
                return (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{asset.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{getAssetTypeLabel(asset.type)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateReadable(asset.acquisitionDate)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-700 dark:text-gray-300">{formatCurrency(asset.acquisitionCost)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-600 dark:text-blue-400">
                        {asset.currentValue !== undefined ? formatCurrency(asset.currentValue) : 'N/A'}
                        {asset.currentValueDate && <span className="block text-xs text-gray-400 dark:text-gray-500">as of {formatDateReadable(asset.currentValueDate)}</span>}
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-semibold ${gainLoss === null ? '' : (gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                        {gainLoss !== null ? formatCurrency(gainLoss) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium space-x-1">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/assets/edit/${asset.id}`)} title="Edit Asset">
                        <i className="fas fa-pencil-alt"></i>
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteClick(asset)} title="Delete Asset">
                        <i className="fas fa-trash-alt"></i>
                        </Button>
                    </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete Asset"
      >
        <p className="text-gray-700 dark:text-gray-200">Are you sure you want to delete the asset: <strong className="font-semibold">{assetToDelete?.name}</strong>?</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This action cannot be undone.</p>
        <div className="mt-6 flex justify-end space-x-3">
           <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
           <Button variant="danger" onClick={confirmDelete} leftIcon={<i className="fas fa-trash-alt"></i>}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
};

export default NonCurrentAssetsScreen;
